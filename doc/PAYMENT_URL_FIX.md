# 支付URL显示空白页面问题修复

## 🐛 问题描述

**症状**：
- 点击"确认支付"后，弹窗打开
- 弹窗URL指向前端域名（Vercel）
- 页面显示空白，没有支付界面

**错误的URL示例**：
```
https://ai-todo-list-xxx.vercel.app/api/payment/mock-pay?orderNo=...
```

**影响**：
- 用户无法看到支付页面
- 无法完成支付流程

---

## 🔍 问题根本原因

### 支付URL使用相对路径

**修复前的代码（❌ 错误）：**

```typescript
// backend/src/payment/payment.service.ts
private async generateAlipayUrl(order: Order): Promise<string> {
  const params = new URLSearchParams({
    orderNo: order.orderNo,
    amount: (order.amount / 100).toFixed(2),
    subject: `Todo Master Pro会员 - ${this.getPlanName(order.planType)}`,
  });
  
  // ❌ 使用相对路径
  return `/api/payment/mock-pay?${params.toString()}&method=alipay`;
}
```

### 为什么会出现问题？

1. **后端返回相对路径** `/api/payment/mock-pay?...`
2. **前端调用 `window.open()`** 打开这个相对路径
3. **浏览器解析URL** 相对于当前页面的域名
4. **当前页面是前端** 域名是 Vercel 的前端地址
5. **最终URL变成** `https://vercel前端域名/api/payment/mock-pay?...`
6. **Vercel没有这个路由** 返回 404 或空白页

### 正确的流程应该是

```
用户在前端点击支付
    ↓
前端调用后端 API 创建订单
    ↓
后端返回包含完整URL的支付链接（Railway域名）
    ↓
前端使用 window.open() 打开完整URL
    ↓
打开 Railway 后端的支付页面 ✅
```

---

## ✅ 解决方案

### 1. 修复支付URL生成

**修复后的代码（✅ 正确）：**

```typescript
// backend/src/payment/payment.service.ts
private async generateAlipayUrl(order: Order): Promise<string> {
  const params = new URLSearchParams({
    orderNo: order.orderNo,
    amount: (order.amount / 100).toFixed(2),
    subject: `Todo Master Pro会员 - ${this.getPlanName(order.planType)}`,
  });
  
  // ✅ 获取后端域名
  const backendUrl = this.configService.get('BACKEND_URL') || 'http://localhost:3000';
  
  // ✅ 使用完整URL（包含域名）
  return `${backendUrl}/api/payment/mock-pay?${params.toString()}&method=alipay`;
}

private async generateWechatPayUrl(order: Order): Promise<string> {
  const params = new URLSearchParams({
    orderNo: order.orderNo,
    amount: (order.amount / 100).toFixed(2),
    subject: `Todo Master Pro会员 - ${this.getPlanName(order.planType)}`,
  });
  
  // ✅ 获取后端域名
  const backendUrl = this.configService.get('BACKEND_URL') || 'http://localhost:3000';
  
  return `${backendUrl}/api/payment/mock-pay?${params.toString()}&method=wechat`;
}
```

### 2. 添加环境变量

**`backend/env.example`**：

```env
# Backend URL (for payment redirect)
BACKEND_URL=http://localhost:3000
```

### 3. Railway 环境变量配置

在 Railway Backend 服务中添加环境变量：

```
BACKEND_URL=https://aitodolist-production.up.railway.app
```

**注意**：
- 不要加尾部斜杠 `/`
- 使用你的实际 Railway 域名

---

## 🚀 部署步骤

### 1. 本地测试

```bash
# 修改 backend/.env
echo "BACKEND_URL=http://localhost:3000" >> backend/.env

# 重启后端
cd backend
npm run start:dev
```

### 2. Railway 部署

#### 方法一：通过 Railway Dashboard

1. 登录 [Railway Dashboard](https://railway.app/)
2. 选择你的项目
3. 点击 **Backend** 服务
4. 点击 **Variables** 标签
5. 点击 **+ New Variable**
6. 添加：
   - **Name**: `BACKEND_URL`
   - **Value**: `https://aitodolist-production.up.railway.app`
   （替换为你的实际域名）
7. 点击 **Save**
8. Railway 会自动重新部署 ✅

#### 方法二：通过 Railway CLI

```bash
railway link
railway variables set BACKEND_URL=https://aitodolist-production.up.railway.app
```

### 3. 验证修复

1. 等待 Railway 重新部署完成（1-2 分钟）
2. 访问前端页面
3. 选择套餐并点击"确认支付"
4. **预期**：支付页面显示正常 ✅
5. **URL应该是**：`https://aitodolist-production.up.railway.app/api/payment/mock-pay?...`

---

## 🎯 修复前后对比

### 修复前 ❌

```
创建订单 API 响应:
{
  "payUrl": "/api/payment/mock-pay?orderNo=xxx&amount=19.90..."
}

前端打开:
window.open("/api/payment/mock-pay?...")

浏览器解析为:
https://ai-todo-list-xxx.vercel.app/api/payment/mock-pay?...
                ↑ 前端域名

结果: 404 或空白页 ❌
```

### 修复后 ✅

```
创建订单 API 响应:
{
  "payUrl": "https://aitodolist-production.up.railway.app/api/payment/mock-pay?orderNo=xxx&amount=19.90..."
}

前端打开:
window.open("https://aitodolist-production.up.railway.app/api/payment/mock-pay?...")

浏览器直接访问:
https://aitodolist-production.up.railway.app/api/payment/mock-pay?...
                ↑ 后端域名

结果: 支付页面正常显示 ✅
```

---

## 🔍 如何查看Railway域名

### 方法一：Railway Dashboard

1. 登录 [Railway Dashboard](https://railway.app/)
2. 选择你的项目
3. 点击 **Backend** 服务
4. 点击 **Settings** 标签
5. 向下滚动到 **Domains** 部分
6. 复制 **Public Domain**（例如：`aitodolist-production.up.railway.app`）

### 方法二：Railway CLI

```bash
railway link
railway status

# 输出会显示：
# Service: backend
# URL: https://aitodolist-production.up.railway.app
```

---

## 🧪 测试支付页面

### 正确的支付页面应该显示：

```
┌─────────────────────────────────┐
│                                 │
│            💳                   │
│        支付宝支付                │
│                                 │
│  Todo Master Pro会员 - 月度会员  │
│                                 │
│            ¥19.90               │
│                                 │
│  订单号：TD1767771729697LZ7WE2  │
│                                 │
│      [  确认支付  ]             │
│      [    取消    ]             │
│                                 │
└─────────────────────────────────┘
```

### 点击"确认支付"后：

1. 弹出提示："支付成功！窗口将自动关闭"
2. 窗口自动关闭
3. 主页面开始轮询订单状态
4. 检测到支付成功
5. 更新用户 Pro 状态
6. 跳转到 `/todos` 页面 ✅

---

## ⚠️ 常见问题

### 问题 1：Railway 域名是什么？

**答**：
- 查看 Railway Dashboard 的 Backend 服务
- Settings → Domains → Public Domain
- 格式：`xxx-production.up.railway.app`

### 问题 2：需要修改前端代码吗？

**答**：
- **不需要** ✅
- 前端只是调用 `window.open(data.payUrl)`
- `data.payUrl` 现在是完整URL，不需要前端做任何改动

### 问题 3：本地开发如何测试？

**答**：
```bash
# backend/.env
BACKEND_URL=http://localhost:3000

# 启动后端
cd backend
npm run start:dev

# 启动前端（另一个终端）
cd frontend
npm run dev
```

支付URL会变成：`http://localhost:3000/api/payment/mock-pay?...`

### 问题 4：支付页面仍然是空白？

**检查清单**：
1. ✅ Railway Backend 是否添加了 `BACKEND_URL` 环境变量
2. ✅ Railway 是否重新部署完成
3. ✅ `BACKEND_URL` 值是否正确（没有尾部斜杠）
4. ✅ Railway Backend 是否正常运行

---

## 📝 总结

### 核心问题

- ❌ 使用相对路径生成支付URL
- ❌ 浏览器解析为前端域名
- ❌ 前端没有支付路由，返回空白页

### 解决方案

- ✅ 使用完整URL（包含后端域名）
- ✅ 添加 `BACKEND_URL` 环境变量
- ✅ 支付页面正确显示在后端域名

### 部署要求

1. ✅ 修改 `payment.service.ts` 代码
2. ✅ 添加 `BACKEND_URL` 到 `env.example`
3. ✅ 在 Railway 添加 `BACKEND_URL` 环境变量
4. ✅ Railway 自动重新部署

---

最后更新：2026-01-07

