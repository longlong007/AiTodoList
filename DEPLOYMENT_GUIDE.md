# 云端部署完整指南

本项目采用以下云服务部署架构：
- **前端**：Vercel
- **后端**：Railway
- **数据库**：Railway PostgreSQL

## 📋 部署清单

### ✅ 已完成的配置

- [x] 后端支持 DATABASE_URL 环境变量
- [x] 后端 CORS 配置支持 Vercel 域名
- [x] 前端 API 配置支持环境变量
- [x] 创建 Vercel 配置文件
- [x] Railway 后端生成公网域名

### 🔧 需要手动配置的部分

#### 1. Railway 后端环境变量

在 Railway Backend 服务的 **Variables** 中配置：

```env
# 数据库连接（必需）
DATABASE_URL=${{Postgres.DATABASE_URL}}

# JWT 配置（必需）
JWT_SECRET=生成一个随机密钥
JWT_EXPIRES_IN=7d

# 环境配置（必需）
NODE_ENV=production
PORT=3000

# 前端域名（用于 CORS，必需）
FRONTEND_URL=https://your-vercel-domain.vercel.app

# 智谱 AI（可选）
ZHIPU_API_KEY=你的API密钥或留空
```

**生成 JWT_SECRET**：
```bash
# 在本地运行
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

#### 2. Vercel 前端环境变量

在 Vercel 项目的 **Settings** → **Environment Variables** 中配置：

| Variable Name | Value | Environments |
|--------------|-------|--------------|
| `VITE_API_BASE_URL` | `https://aitodolist-production.up.railway.app/api` | Production, Preview |

#### 3. 本地开发环境变量（可选）

在 `frontend` 目录创建 `.env.development`：

```env
VITE_API_BASE_URL=/api
```

## 🚀 部署步骤

### 第一步：部署数据库（Railway PostgreSQL）

1. ✅ 在 Railway 创建 PostgreSQL 服务
2. ✅ 获取连接信息
3. ⬜ 导入数据库表结构

**导入表结构**：

```bash
# 安装 Railway CLI
npm install -g @railway/cli

# 登录并链接项目
railway login
railway link

# 连接数据库并导入
railway run psql
# 在 psql 中执行：
\i D:/GitCode/MyTools/full_web_demo_cursor/database/schema.sql
```

或使用公网地址（需要先在 Railway 开启 TCP Proxy）：

```bash
psql -h <公网主机> -p <公网端口> -U postgres -d railway -f database/schema.sql
```

### 第二步：部署后端（Railway）

1. ✅ 连接 GitHub 仓库到 Railway
2. ✅ 配置 Root Directory 为 `backend`
3. ✅ 配置环境变量（见上文）
4. ✅ 生成公网域名（Settings → Networking → Generate Domain）
5. ✅ 等待自动部署完成

**验证后端**：
```bash
curl https://aitodolist-production.up.railway.app/api
# 应该返回 404 错误（正常，说明服务在运行）
```

### 第三步：部署前端（Vercel）

1. ✅ 连接 GitHub 仓库到 Vercel
2. ✅ 配置 Root Directory 为 `frontend`
3. ✅ 配置 Build Command 为 `npm run build`
4. ✅ 配置 Output Directory 为 `dist`
5. ⬜ 配置环境变量（见上文）
6. ⬜ 部署并获取域名
7. ⬜ 将 Vercel 域名更新到 Railway 的 FRONTEND_URL

**完成后**：
- 在 Railway 更新 `FRONTEND_URL` 为你的 Vercel 域名
- 在 Railway 重新部署后端

### 第四步：测试完整流程

1. 访问 Vercel 前端域名
2. 尝试注册/登录
3. 创建待办事项
4. 测试 AI 分析功能
5. 测试支付流程

## 🔗 重要地址

### 后端
- **Railway 域名**：https://aitodolist-production.up.railway.app
- **API 基础路径**：https://aitodolist-production.up.railway.app/api

### 前端
- **Vercel 域名**：待配置

### 数据库
- **内网地址**：postgres.railway.internal:5432
- **公网地址**：需要在 Railway 开启 TCP Proxy

## 📊 配置文件说明

### 后端配置
- `backend/railway.json` - Railway 构建配置
- `backend/Dockerfile` - Docker 构建配置
- `backend/Procfile` - 启动命令（已删除，使用 railway.json）
- `backend/src/main.ts` - CORS 和服务器配置
- `backend/src/app.module.ts` - 数据库连接配置

### 前端配置
- `frontend/vercel.json` - Vercel 路由和安全头配置
- `frontend/vite.config.ts` - Vite 构建和代理配置
- `frontend/src/api/index.ts` - API 请求配置
- `frontend/.env.production` - 生产环境变量（需手动创建）

## 🐛 常见问题排查

### 1. 后端无法连接数据库

**检查**：
- Railway Backend Variables 中的 `DATABASE_URL` 是否配置正确
- Backend 和 Postgres 是否在同一个 Railway 项目
- 查看 Railway Deploy Logs 中的错误信息

**解决**：
```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

### 2. 前端 CORS 错误

**检查**：
- Railway Backend Variables 中的 `FRONTEND_URL` 是否为正确的 Vercel 域名
- Railway 后端是否已重新部署

**解决**：
```env
FRONTEND_URL=https://your-actual-vercel-domain.vercel.app
```

### 3. 前端 API 请求 404

**检查**：
- Vercel Environment Variables 中的 `VITE_API_BASE_URL` 是否配置
- 是否在配置后重新部署了前端

**解决**：
在 Vercel 配置：
```
VITE_API_BASE_URL=https://aitodolist-production.up.railway.app/api
```

### 4. Railway 构建失败

**检查**：
- Root Directory 是否设置为 `backend`
- `railway.json` 配置是否正确
- Node.js 版本是否兼容（需要 >= 18.0.0）

**解决**：
确保 `backend/package.json` 中有：
```json
{
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
}
```

## 📚 相关文档

- [Railway 部署配置](backend/RAILWAY_ENV_SETUP.md)
- [前端环境变量](frontend/ENV_CONFIG.md)
- [数据库快速开始](QUICK_START_DATABASE.md)

## 🎯 下一步

1. ⬜ 导入数据库表结构
2. ⬜ 配置 Vercel 环境变量
3. ⬜ 更新 Railway 的 FRONTEND_URL
4. ⬜ 测试完整功能

---

最后更新：2026-01-05

