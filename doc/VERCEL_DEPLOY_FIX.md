# Vercel 前端部署问题修复指南

## 🔍 问题诊断

你的前端代码已经推送到 GitHub，包含了 OAuth 回调页面 `AuthCallback.vue`，但 Vercel 上可能还是旧版本。

## ✅ 解决步骤

### 步骤 1：检查 Vercel 部署状态

1. 登录 [Vercel](https://vercel.com)
2. 进入你的前端项目
3. 点击 **Deployments** 标签
4. 查看最新的部署：
   - ✅ 如果显示 "Ready" 且提交信息是 "添加 Google 和 GitHub OAuth 登录功能"
   - ❌ 如果最新部署是更早的提交，说明没有自动部署

### 步骤 2：触发重新部署

#### 方法一：在 Vercel 控制台重新部署（推荐）

1. 在 **Deployments** 标签
2. 找到最新的部署
3. 点击右边的 **...** 菜单
4. 选择 **Redeploy**
5. 确认 **Use existing Build Cache** 取消勾选（重新构建）
6. 点击 **Redeploy**

#### 方法二：推送一个小更新触发部署

如果 Vercel 没有自动部署，可以推送一个小更新：

```bash
# 添加一个空提交
git commit --allow-empty -m "trigger vercel deployment"
git push origin main
```

### 步骤 3：等待部署完成

1. 在 Vercel Deployments 页面
2. 等待新部署变成 "Ready"（通常 1-3 分钟）
3. 点击部署查看详情

### 步骤 4：验证部署

访问以下 URL 验证：

```
https://your-vercel-domain.vercel.app/auth/callback
```

**期望结果**：
- 显示 "正在登录..." 加载界面
- 或者因为没有 token 参数，自动跳转到 `/login`

**如果仍然 404**：
- 说明部署有问题，继续下一步

---

## 🔧 高级排查

### 检查 Vercel 项目配置

#### 1. 检查 Git 集成

1. 在 Vercel 项目页面
2. 点击 **Settings** 标签
3. 点击 **Git** 部分
4. 确认：
   - ✅ **Connected Git Repository**: 正确的 GitHub 仓库
   - ✅ **Production Branch**: `main`（或你的主分支）
   - ✅ **Deployment Protection**: 关闭或正确配置

#### 2. 检查构建设置

1. 在 **Settings** → **General**
2. 确认：
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

#### 3. 检查自动部署

1. 在 **Settings** → **Git**
2. 确认 **Ignored Build Step** 没有设置
3. 确认没有勾选 "Ignore for Production Deployments"

### 检查构建日志

1. 在最新的 Deployment
2. 点击 **Building** 阶段
3. 查看构建日志

**查找以下内容**：

✅ **成功的构建日志**：
```
✓ built in XXms
✓ dist/index.html                          XX.XX kB
✓ dist/assets/AuthCallback-abc123.js       X.XX kB
```

❌ **失败的构建**：
- 查看错误信息
- 通常是依赖安装失败或构建错误

---

## 🚨 常见问题

### 问题 1：Vercel 没有自动部署

**原因**：
- Git 集成配置错误
- Production Branch 设置错误
- Webhook 失败

**解决方案**：
1. 断开并重新连接 Git 仓库
2. 或手动触发部署（方法二）

### 问题 2：构建失败

**检查**：
- 构建日志中的错误信息
- 是否有依赖缺失
- 是否有 TypeScript 错误

**解决方案**：
```bash
# 本地测试构建
cd frontend
npm install
npm run build
```

如果本地成功，Vercel 也应该成功。

### 问题 3：部署成功但 404

**原因**：
- `vercel.json` 重写规则问题
- 文件没有正确打包

**解决方案**：
检查 `vercel.json` 是否正确（已在项目中）：
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

## 💡 快速修复（立即执行）

### 选项 A：手动重新部署（最快）

1. **Vercel** → 你的项目 → **Deployments**
2. 点击最新部署的 **...** → **Redeploy**
3. 取消勾选 **Use existing Build Cache**
4. 点击 **Redeploy**
5. 等待 1-3 分钟

### 选项 B：推送触发部署

```bash
git commit --allow-empty -m "trigger vercel redeploy"
git push origin main
```

### 选项 C：使用 Vercel CLI

```bash
# 安装 Vercel CLI
npm install -g vercel

# 登录
vercel login

# 部署
cd frontend
vercel --prod
```

---

## ✅ 验证成功

部署成功后，测试：

1. **访问回调页面**：
   ```
   https://your-vercel-domain.vercel.app/auth/callback
   ```
   应该看到 "正在登录..." 或跳转到登录页

2. **测试 Google 登录**：
   - 访问 `/login`
   - 点击 Google 登录
   - 完成授权
   - 应该成功跳转到 `/todos`

---

## 📋 完整检查清单

- [ ] GitHub 上的代码是最新的（包含 AuthCallback.vue）
- [ ] Vercel 已连接到正确的 GitHub 仓库
- [ ] Vercel Production Branch 设置为 `main`
- [ ] Vercel 最新部署的提交信息是 "添加 Google 和 GitHub OAuth 登录功能"
- [ ] Vercel 部署状态是 "Ready"
- [ ] 访问 `/auth/callback` 不再显示 404
- [ ] Railway `FRONTEND_URL` 已更新为正确的 Vercel 域名
- [ ] Google OAuth 登录流程完整

---

## 🎯 预期结果

完成所有步骤后：
1. ✅ 访问 `https://your-domain.vercel.app/auth/callback` 不再 404
2. ✅ Google 登录后成功跳转到待办页面
3. ✅ GitHub 登录也能正常工作

---

最后更新：2026-01-05

