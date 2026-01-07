# 🚀 快速部署检查清单

配置已完成！现在按照以下步骤完成部署：

## ✅ 第一步：配置 Railway 后端环境变量

1. 登录 [Railway](https://railway.app)
2. 进入你的项目
3. 点击 **Backend** 服务
4. 点击 **Variables** 标签
5. 点击 **Raw Editor**
6. 添加 `FRONTEND_URL` 环境变量：

```env
FRONTEND_URL=https://your-vercel-domain.vercel.app
```

**注意**：将 `your-vercel-domain` 替换为你的实际 Vercel 域名（下一步会获取）

7. 点击 **Save**

## ✅ 第二步：配置 Vercel 前端环境变量

1. 登录 [Vercel](https://vercel.com)
2. 进入你的前端项目
3. 点击 **Settings** 标签
4. 点击 **Environment Variables**
5. 添加环境变量：

| Variable Name | Value | Environments |
|--------------|-------|--------------|
| `VITE_API_BASE_URL` | `https://aitodolist-production.up.railway.app/api` | Production ✅ Preview ✅ |

6. 点击 **Save**

## ✅ 第三步：获取 Vercel 域名并更新 Railway

1. 在 Vercel 项目页面，复制你的生产域名（例如：`your-app.vercel.app`）
2. 回到 Railway Backend 服务 → Variables
3. 更新 `FRONTEND_URL` 为你的 Vercel 域名：
   ```
   FRONTEND_URL=https://your-app.vercel.app
   ```
4. 点击 **Save**

## ✅ 第四步：重新部署

### 重新部署 Vercel 前端

1. 进入 Vercel 项目
2. 点击 **Deployments** 标签
3. 点击最新部署右边的 **...** 菜单
4. 选择 **Redeploy**

### 重新部署 Railway 后端

1. 进入 Railway Backend 服务
2. 点击 **Deployments** 标签
3. 点击 **Deploy** 按钮

## ✅ 第五步：测试部署

### 1. 测试后端健康状态

在浏览器访问或使用 curl：

```bash
curl https://aitodolist-production.up.railway.app/api
```

应该返回 404 错误（这是正常的，说明服务在运行）

### 2. 测试前端访问

1. 访问你的 Vercel 域名
2. 打开浏览器开发者工具（F12）
3. 尝试登录或注册
4. 在 **Network** 标签中查看 API 请求
5. 确认请求发往 `https://aitodolist-production.up.railway.app/api`

### 3. 测试 CORS

如果出现 CORS 错误：
```
Access to XMLHttpRequest ... has been blocked by CORS policy
```

**解决方案**：
1. 确认 Railway `FRONTEND_URL` 配置正确
2. 重新部署 Railway 后端
3. 清除浏览器缓存
4. 刷新前端页面

## 📋 环境变量完整清单

### Railway Backend 必需变量：

```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
NODE_ENV=production
PORT=3000
JWT_SECRET=生成的随机密钥
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://your-vercel-domain.vercel.app
```

### Vercel Frontend 必需变量：

```env
VITE_API_BASE_URL=https://aitodolist-production.up.railway.app/api
```

## 🎯 完成标志

✅ Railway 后端显示 "Running"  
✅ Vercel 前端显示 "Ready"  
✅ 访问前端可以看到登录页面  
✅ 可以注册新用户  
✅ 可以登录并使用功能  
✅ 没有 CORS 错误  
✅ API 请求成功  

## 🐛 遇到问题？

查看详细文档：
- [完整部署指南](DEPLOYMENT_GUIDE.md)
- [Railway 环境配置](backend/RAILWAY_ENV_SETUP.md)
- [前端环境配置](frontend/ENV_CONFIG.md)

---

需要帮助？检查：
1. Railway Deploy Logs（后端日志）
2. Vercel Build Logs（前端构建日志）
3. 浏览器 Console（前端运行错误）
4. 浏览器 Network（API 请求状态）

