# 支付失败调试指南

## 🐛 问题描述

**症状**：点击支付页面的"确认支付"按钮后，显示 "Internal server error"

---

## 🔍 调试步骤

### 1. 查看浏览器控制台（必做）

1. 在支付页面按 **F12** 打开开发者工具
2. 切换到 **Console** 标签
3. 点击"确认支付"按钮
4. 查看控制台输出

**正常的日志应该是**：
```
开始支付，订单号: TD1767...
收到响应，状态码: 200
支付结果: {success: true, order: {...}}
```

**如果失败，会看到**：
```
开始支付，订单号: TD1767...
收到响应，状态码: 500
支付请求失败: HTTP error! status: 500
```

### 2. 查看 Railway 后端日志（关键）

1. 登录 [Railway Dashboard](https://railway.app/)
2. 选择你的项目
3. 点击 **Backend** 服务
4. 点击 **Deployments** 标签
5. 点击最新的部署
6. 查看 **Logs**

**查找以下日志**：
```
==========================================
收到支付完成请求: { orderNo: 'TD1767...' }
订单号: TD1767...
==========================================
📝 mockPaymentComplete 开始处理: TD1767...
📋 订单查询结果: 找到订单 xxx
💰 当前订单状态: pending
🔄 开始执行支付完成流程...
✅ 订单更新后状态: paid
🎉 支付完成处理成功
✅ 支付处理成功，订单状态: paid
```

**如果有错误，会看到**：
```
❌ 支付处理失败: [错误信息]
错误详情: { message: ..., stack: ... }
```

---

## 🎯 常见错误及解决方法

### 错误 1：订单不存在

**日志**：
```
📋 订单查询结果: 订单不存在
❌ mockPaymentComplete 失败: NotFoundException: 订单不存在: TD1767...
```

**原因**：
- 数据库中没有这个订单
- 订单创建失败
- 数据库连接问题

**解决方法**：
1. 检查 Railway 数据库是否连接正常
2. 检查 `DATABASE_URL` 环境变量是否配置正确
3. 重新创建订单并测试

---

### 错误 2：数据库连接失败

**日志**：
```
❌ mockPaymentComplete 失败: Error: Connection terminated unexpectedly
或
❌ mockPaymentComplete 失败: Error: ECONNREFUSED
```

**原因**：
- 数据库服务未启动
- `DATABASE_URL` 配置错误
- 网络问题

**解决方法**：
1. **检查 Railway Postgres 服务是否运行**
   - Railway Dashboard → Postgres 服务
   - 查看状态是否为 "Active"

2. **检查 DATABASE_URL 环境变量**
   ```bash
   railway variables
   ```
   
   应该看到：
   ```
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   ```

3. **测试数据库连接**
   ```bash
   railway run psql
   ```

---

### 错误 3：用户服务错误

**日志**：
```
订单状态已更新为PAID: TD1767...
❌ 更新用户会员状态失败: Cannot read properties of undefined
```

**原因**：
- `userService.findById()` 返回 null
- 用户不存在

**解决方法**：
1. 确认用户ID正确
2. 检查 users 表是否有该用户
3. 重新登录并创建订单

---

### 错误 4：CORS 错误（不太可能）

**浏览器控制台**：
```
Access to fetch at '...' from origin '...' has been blocked by CORS policy
```

**原因**：
- 支付页面和API不在同一域名

**解决方法**：
这不应该发生，因为支付页面就在后端域名上。如果出现：
1. 检查支付页面URL是否正确
2. 确认 `BACKEND_URL` 环境变量已配置

---

### 错误 5：环境变量未配置

**可能的错误**：
```
TypeError: Cannot read property 'get' of undefined
```

**检查清单**：
- [ ] `DATABASE_URL` 已配置
- [ ] `BACKEND_URL` 已配置
- [ ] `JWT_SECRET` 已配置
- [ ] Railway Backend 已重新部署

---

## 📋 完整检查清单

### Railway Backend 环境变量

登录 Railway Dashboard，确认以下环境变量已配置：

```
✅ DATABASE_URL=${{Postgres.DATABASE_URL}}
✅ BACKEND_URL=https://aitodolist-production.up.railway.app
✅ JWT_SECRET=your-secret-key
✅ ZHIPU_API_KEY=your-api-key
✅ NODE_ENV=production
✅ FRONTEND_URL=https://your-frontend.vercel.app
✅ GOOGLE_CLIENT_ID=...
✅ GOOGLE_CLIENT_SECRET=...
✅ GOOGLE_CALLBACK_URL=https://aitodolist-production.up.railway.app/api/auth/google/callback
✅ GITHUB_CLIENT_ID=...
✅ GITHUB_CLIENT_SECRET=...
✅ GITHUB_CALLBACK_URL=https://aitodolist-production.up.railway.app/api/auth/github/callback
```

### Railway Postgres 服务

- [ ] Postgres 服务状态为 "Active"
- [ ] 可以通过 Railway CLI 连接
- [ ] `orders` 表已创建
- [ ] `users` 表已创建

### 支付流程测试

1. [ ] 访问 `/pricing` 页面
2. [ ] 选择套餐
3. [ ] 点击"确认支付"
4. [ ] 支付窗口正确打开
5. [ ] 支付页面显示正常
6. [ ] 点击"确认支付"
7. [ ] 查看浏览器控制台日志
8. [ ] 查看 Railway 后端日志

---

## 🛠️ 高级调试

### 1. 使用 Railway CLI 查看实时日志

```bash
railway link
railway logs --follow
```

然后在另一个窗口测试支付流程。

### 2. 直接测试支付完成 API

使用 curl 或 Postman 测试：

```bash
curl -X POST https://aitodolist-production.up.railway.app/api/payment/mock-complete \
  -H "Content-Type: application/json" \
  -d '{"orderNo": "你的订单号"}'
```

**预期响应**：
```json
{
  "success": true,
  "order": {
    "id": "...",
    "orderNo": "...",
    "status": "paid",
    ...
  }
}
```

### 3. 检查数据库订单状态

```bash
railway run psql

SELECT "orderNo", "status", "userId", "createdAt" 
FROM orders 
ORDER BY "createdAt" DESC 
LIMIT 5;
```

---

## 📊 日志详解

### 支付完成流程的完整日志

```
# 1. 收到支付请求
==========================================
收到支付完成请求: { orderNo: 'TD1767771729697LZ7WE2' }
订单号: TD1767771729697LZ7WE2
==========================================

# 2. 开始处理
📝 mockPaymentComplete 开始处理: TD1767771729697LZ7WE2

# 3. 查询订单
📋 订单查询结果: 找到订单 d8f5e3c2-...

# 4. 检查状态
💰 当前订单状态: pending

# 5. 执行支付流程
🔄 开始执行支付完成流程...
开始处理支付完成: { orderNo: 'TD1767...', tradeNo: 'MOCK1767771730000' }

# 6. 更新订单
订单状态已更新为PAID: TD1767771729697LZ7WE2

# 7. 更新用户会员
用户会员状态已更新: { 
  userId: '8e2f1a3b-...', 
  accountType: 'pro',
  expireAt: '2026-02-07T12:15:30.000Z'
}

# 8. 完成
支付处理完成
✅ 订单更新后状态: paid
🎉 支付完成处理成功
✅ 支付处理成功，订单状态: paid
```

---

## 🎯 快速诊断命令

### 检查后端服务状态
```bash
curl https://aitodolist-production.up.railway.app/api/payment/plans
```

### 检查数据库连接
```bash
railway run psql -c "SELECT 1;"
```

### 查看最近的订单
```bash
railway run psql -c "SELECT * FROM orders ORDER BY \"createdAt\" DESC LIMIT 1;"
```

### 查看环境变量
```bash
railway variables
```

---

## 💡 提示

1. **最重要**：查看 Railway 后端日志
2. 支付失败后，查看浏览器控制台的 Network 标签
3. 确认 Railway Backend 最新部署已完成
4. 检查所有环境变量是否配置正确

---

## 📞 还是不行？

请提供以下信息：

1. **浏览器控制台的完整日志**（截图或复制文本）
2. **Railway 后端日志**（相关部分）
3. **支付URL**（完整URL，隐藏敏感信息）
4. **错误信息**（完整的错误消息）

这样我们可以更快地定位问题！

---

最后更新：2026-01-07

