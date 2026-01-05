# 前端环境变量配置指南

## 📁 需要创建的文件

在 `frontend` 目录下创建以下两个文件：

### 1. `.env.production` (生产环境)

在 Vercel 部署时使用，指向 Railway 后端。

```env
# 生产环境配置 - Vercel 部署
VITE_API_BASE_URL=https://aitodolist-production.up.railway.app/api
```

### 2. `.env.development` (开发环境)

在本地开发时使用，使用 Vite 代理。

```env
# 开发环境配置 - 本地开发
# 使用 Vite 代理，请求会转发到 vite.config.ts 中配置的 proxy target
VITE_API_BASE_URL=/api
```

## 🚀 Vercel 环境变量配置

### 方法一：在 Vercel 控制台配置（推荐）

1. 登录 [Vercel](https://vercel.com)
2. 进入你的前端项目
3. 点击 **Settings** 标签
4. 点击 **Environment Variables**
5. 添加以下环境变量：

| Variable Name | Value | Environments |
|--------------|-------|--------------|
| `VITE_API_BASE_URL` | `https://aitodolist-production.up.railway.app/api` | Production, Preview |

6. 点击 **Save**
7. 重新部署项目（Deployments → Redeploy）

### 方法二：使用 Vercel CLI

```bash
# 安装 Vercel CLI
npm install -g vercel

# 登录
vercel login

# 链接项目
vercel link

# 添加环境变量
vercel env add VITE_API_BASE_URL production
# 输入: https://aitodolist-production.up.railway.app/api

vercel env add VITE_API_BASE_URL preview
# 输入: https://aitodolist-production.up.railway.app/api

# 拉取环境变量到本地
vercel env pull
```

## ✅ 验证配置

### 1. 本地开发

```bash
cd frontend
npm run dev
```

访问 http://localhost:5173，检查 Network 标签，API 请求应该代理到 `http://localhost:3000/api`

### 2. 生产环境

部署到 Vercel 后：
1. 打开浏览器开发者工具（F12）
2. 查看 Network 标签
3. 尝试登录或其他 API 操作
4. 请求应该发往 `https://aitodolist-production.up.railway.app/api`

## 🐛 常见问题

### Q1: CORS 错误

**现象**：
```
Access to XMLHttpRequest at 'https://aitodolist-production.up.railway.app/api/...' 
from origin 'https://your-app.vercel.app' has been blocked by CORS policy
```

**解决方案**：
确保在 Railway Backend 的环境变量中添加：
```
FRONTEND_URL=https://your-vercel-domain.vercel.app
```

### Q2: API 请求 404

**现象**：
```
GET https://your-vercel-domain.vercel.app/api/auth/login 404
```

**解决方案**：
1. 确认 Vercel 环境变量 `VITE_API_BASE_URL` 已配置
2. 重新部署前端
3. 清除浏览器缓存

### Q3: Railway 后端无法访问

**现象**：
```
Failed to fetch
ERR_CONNECTION_REFUSED
```

**解决方案**：
1. 确认 Railway 后端服务正在运行
2. 确认在 Railway Settings → Networking 已生成公网域名
3. 测试后端健康：`curl https://aitodolist-production.up.railway.app/api`

## 📝 注意事项

1. ⚠️ `.env` 文件不会被提交到 Git（已在 .gitignore 中）
2. ⚠️ 本地开发时需要手动创建 `.env.development`
3. ⚠️ 生产环境变量在 Vercel 控制台配置，不需要 `.env.production` 文件
4. ✅ 环境变量必须以 `VITE_` 开头才能在前端代码中访问
5. ✅ 修改环境变量后需要重新构建才能生效

## 🔗 相关文档

- [Vite 环境变量](https://vitejs.dev/guide/env-and-mode.html)
- [Vercel 环境变量](https://vercel.com/docs/environment-variables)
- [Railway 域名配置](https://docs.railway.app/deploy/exposing-your-app)

---

最后更新：2026-01-05

