# OAuth 重复登录问题修复文档

## 🐛 问题描述

### 现象
1. **第一次** OAuth 登录（Google/GitHub）→ ✅ 直接跳转到 `/todos`
2. **退出登录**
3. **第二次** OAuth 登录（用另一种方式）→ ❌ 先跳转到 `/login`，需要再次点击登录按钮

### 影响
- 用户体验差
- OAuth 登录流程不流畅
- 给人"登录失败"的错觉

---

## 🔍 问题根本原因

### 原因 1：响应式状态不同步

**问题代码（修复前）**：
```typescript
// AuthCallback.vue
onMounted(async () => {
  const token = route.query.token as string
  
  if (token) {
    // ❌ 只保存到 localStorage，没有更新 authStore.token
    localStorage.setItem('token', token)
    
    // 调用 fetchCurrentUser
    await authStore.fetchCurrentUser()
    router.push('/todos')
  }
})

// auth.ts - fetchCurrentUser（修复前）
const fetchCurrentUser = async () => {
  // ❌ 没有从 localStorage 同步 token 到 store
  const { data } = await authApi.getCurrentUser()
  user.value = data
  localStorage.setItem('user', JSON.stringify(data))
}
```

**问题**：
- `localStorage.token` 有值 ✅
- `authStore.token.value` 是 `null` ❌
- `isAuthenticated` 计算为 `false` ❌

### 原因 2：路由守卫时序问题

**问题代码（修复前）**：
```typescript
router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()
  
  // ❌ 对所有路由都检查，包括 /auth/callback
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else if (to.meta.guest && authStore.isAuthenticated) {
    next('/todos')
  } else {
    next()
  }
})
```

**时序问题**：
```
1. OAuth 回调 → /auth/callback
2. 路由守卫检查 authStore.isAuthenticated → false（因为 token 还没同步）
3. 虽然 /auth/callback 没有 requiresAuth，放行
4. AuthCallback 组件开始处理
5. 保存 token 到 localStorage
6. 调用 fetchCurrentUser（但没有同步 token 到 store）
7. router.push('/todos')
8. 路由守卫再次检查 → isAuthenticated 仍然是 false ❌
9. 重定向到 /login ❌
```

---

## ✅ 解决方案

### 修复 1：强制同步 token 到 store

**修复后的代码**：
```typescript
// auth.ts - fetchCurrentUser
const fetchCurrentUser = async () => {
  // ✅ 强制从 localStorage 读取最新 token
  const storedToken = localStorage.getItem('token')
  if (!storedToken) {
    throw new Error('No token found')
  }
  
  // ✅ 同步到响应式 ref
  token.value = storedToken
  
  try {
    const { data } = await authApi.getCurrentUser()
    user.value = data
    localStorage.setItem('user', JSON.stringify(data))
    return data
  } catch (error) {
    clearAuth()
    throw error
  }
}
```

### 修复 2：路由守卫跳过 OAuth 回调

**修复后的代码**：
```typescript
router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()
  
  // ✅ OAuth 回调路由不检查认证状态
  if (to.path === '/auth/callback') {
    next()
    return
  }
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else if (to.meta.guest && authStore.isAuthenticated) {
    next('/todos')
  } else {
    next()
  }
})
```

### 修复 3：改进 AuthCallback 组件

**修复后的代码**：
```typescript
onMounted(async () => {
  const token = route.query.token as string
  
  if (!token) {
    console.error('No token in callback')
    router.push('/login')
    return
  }
  
  try {
    // 1. 保存 token
    localStorage.setItem('token', token)
    
    // 2. 获取用户信息（内部会同步 token 到 store）
    await authStore.fetchCurrentUser()
    
    // 3. 成功后跳转
    console.log('OAuth login successful, redirecting to /todos')
    router.push('/todos')
  } catch (error) {
    console.error('OAuth callback failed:', error)
    // 清除无效 token
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/login')
  }
})
```

---

## 🎯 修复后的流程

### 正确的 OAuth 登录流程

```
1. 用户点击 Google/GitHub 登录
   ↓
2. 跳转到后端 OAuth 入口
   ↓
3. 重定向到 Google/GitHub 授权页面
   ↓
4. 用户授权完成
   ↓
5. Google/GitHub 回调到后端
   ↓
6. 后端生成 JWT token
   ↓
7. 重定向到前端 /auth/callback?token=xxx
   ↓
8. 路由守卫：检测到 /auth/callback，直接放行 ✅
   ↓
9. AuthCallback 组件：
   - 保存 token 到 localStorage ✅
   - 调用 fetchCurrentUser ✅
   - fetchCurrentUser 内部同步 token 到 store ✅
   - 获取用户信息并保存 ✅
   ↓
10. router.push('/todos')
   ↓
11. 路由守卫：检查 isAuthenticated
    - authStore.token.value 有值 ✅
    - isAuthenticated = true ✅
    - 放行 ✅
   ↓
12. 成功进入 /todos 页面 ✅
```

---

## 📊 数据同步状态对比

### 修复前（错误）

| 时间点 | localStorage.token | authStore.token | isAuthenticated | 结果 |
|--------|-------------------|-----------------|-----------------|------|
| OAuth 回调 | ✅ 存在 | ❌ null | ❌ false | - |
| fetchCurrentUser | ✅ 存在 | ❌ null | ❌ false | - |
| 跳转到 /todos | ✅ 存在 | ❌ null | ❌ false | 被路由守卫拦截 |
| 重定向到 /login | ✅ 存在 | ❌ null | ❌ false | 用户困惑 |

### 修复后（正确）

| 时间点 | localStorage.token | authStore.token | isAuthenticated | 结果 |
|--------|-------------------|-----------------|-----------------|------|
| OAuth 回调 | ✅ 存在 | ❌ null | ❌ false | 路由守卫跳过 |
| fetchCurrentUser 开始 | ✅ 存在 | ❌ null | ❌ false | - |
| fetchCurrentUser 同步 | ✅ 存在 | ✅ 存在 | ✅ true | - |
| fetchCurrentUser 完成 | ✅ 存在 | ✅ 存在 | ✅ true | user 信息获取 |
| 跳转到 /todos | ✅ 存在 | ✅ 存在 | ✅ true | 路由守卫放行 |
| 成功进入 | ✅ 存在 | ✅ 存在 | ✅ true | ✅ 成功 |

---

## 🧪 测试步骤

### 测试场景 1：首次 OAuth 登录

1. 清除浏览器缓存和 localStorage
2. 访问登录页
3. 点击 Google 登录
4. 完成授权
5. **期望**：直接跳转到 `/todos` ✅

### 测试场景 2：切换 OAuth 方式登录

1. 第一次用 Google 登录成功
2. 退出登录
3. 点击 GitHub 登录
4. 完成授权
5. **期望**：直接跳转到 `/todos` ✅（不需要二次点击）

### 测试场景 3：多次切换

1. Google 登录 → 退出
2. GitHub 登录 → 退出
3. Google 登录 → 退出
4. 邮箱登录 → 退出
5. GitHub 登录
6. **期望**：每次都直接成功，不需要二次点击 ✅

---

## 🔍 调试方法

### 开启浏览器控制台

按 F12 打开开发者工具，查看 Console 输出：

**正常流程的日志**：
```
OAuth login successful, redirecting to /todos
Router guard: not authenticated, redirecting to /login  ← 不应该出现
```

**如果看到**：
```
Failed to fetch user info: Error: ...
OAuth callback failed: ...
```
说明 API 调用失败，检查：
1. Railway 后端是否正常运行
2. 环境变量是否配置正确
3. 网络连接是否正常

### 检查 localStorage

在 Console 中执行：
```javascript
console.log('token:', localStorage.getItem('token'))
console.log('user:', localStorage.getItem('user'))
```

### 检查 authStore 状态

在 Console 中执行：
```javascript
// 需要在 Vue DevTools 中
$store.state.auth.token
$store.state.auth.user
$store.state.auth.isAuthenticated
```

---

## 📝 关键技术点

### 1. Vue 响应式系统

```typescript
// ref 是响应式的
const token = ref<string | null>(null)

// ✅ 正确：更新 ref.value 触发响应式更新
token.value = newToken

// ❌ 错误：只更新 localStorage 不触发响应式更新
localStorage.setItem('token', newToken)
```

### 2. 计算属性依赖

```typescript
const isAuthenticated = computed(() => !!token.value)

// isAuthenticated 依赖 token.value
// 只有 token.value 改变，isAuthenticated 才会重新计算
```

### 3. 路由守卫时序

```typescript
// 路由守卫在路由跳转前执行
// 如果目标路由需要异步操作，应该：
// 1. 让守卫放行
// 2. 在组件内部处理
// 3. 处理完成后再跳转到其他路由
```

---

## 🎉 总结

### 修复内容

1. ✅ `fetchCurrentUser` 强制从 localStorage 同步 token
2. ✅ 路由守卫跳过 `/auth/callback` 路由
3. ✅ 改进 `AuthCallback` 组件的错误处理
4. ✅ 添加详细的日志输出

### 影响范围

- ✅ 首次 OAuth 登录
- ✅ 切换 OAuth 方式登录
- ✅ 多次登录退出
- ✅ 邮箱/手机登录不受影响

### 预期结果

- ✅ OAuth 登录一步到位
- ✅ 不需要二次点击
- ✅ 流畅的用户体验

---

最后更新：2026-01-06

