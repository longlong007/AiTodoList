# Google 和 GitHub OAuth 登录配置指南

本指南将帮你配置 Google 和 GitHub 第三方登录功能。

## 📋 前置要求

- ✅ 后端已部署到 Railway
- ✅ 前端已部署到 Vercel
- ✅ 拥有 Google 和 GitHub 账号

---

## 🔐 第一步：配置 Google OAuth

### 1. 创建 Google Cloud 项目

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 点击顶部的项目下拉菜单 → **新建项目**
3. 输入项目名称（例如：`TodoMaster`）
4. 点击 **创建**

### 2. 启用 Google+ API

1. 在左侧菜单选择 **API和服务** → **库**
2. 搜索 `Google+ API`
3. 点击进入并点击 **启用**

### 3. 配置 OAuth 同意屏幕

1. 在左侧菜单选择 **API和服务** → **OAuth 同意屏幕**
2. 选择 **外部**（External）→ 点击 **创建**
3. 填写应用信息：
   - **应用名称**：TodoMaster
   - **用户支持电子邮件**：你的邮箱
   - **应用首页**：你的 Vercel 域名
   - **授权域**：
     - `vercel.app`
     - `railway.app`
   - **开发者联系信息**：你的邮箱
4. 点击 **保存并继续**
5. **作用域**：跳过，点击 **保存并继续**
6. **测试用户**：添加你的测试邮箱
7. 点击 **保存并继续**

### 4. 创建 OAuth 客户端 ID

1. 在左侧菜单选择 **API和服务** → **凭据**
2. 点击 **+ 创建凭据** → **OAuth 客户端 ID**
3. 应用类型选择 **Web 应用**
4. 填写信息：
   - **名称**：TodoMaster Web Client
   - **已获授权的 JavaScript 来源**：
     ```
     http://localhost:5173
     https://your-vercel-domain.vercel.app
     ```
   - **已获授权的重定向 URI**：
     ```
     http://localhost:3000/api/auth/google/callback
     https://aitodolist-production.up.railway.app/api/auth/google/callback
     ```
5. 点击 **创建**
6. **保存客户端 ID 和客户端密钥**！

---

## 🐙 第二步：配置 GitHub OAuth

### 1. 创建 OAuth App

1. 访问 [GitHub Settings](https://github.com/settings/developers)
2. 点击左侧 **OAuth Apps**
3. 点击 **New OAuth App**

### 2. 填写应用信息

- **Application name**：TodoMaster
- **Homepage URL**：
  ```
  https://your-vercel-domain.vercel.app
  ```
- **Application description**：智能待办管理应用
- **Authorization callback URL**：
  ```
  https://aitodolist-production.up.railway.app/api/auth/github/callback
  ```

### 3. 注册应用

1. 点击 **Register application**
2. 在应用页面，点击 **Generate a new client secret**
3. **保存 Client ID 和 Client Secret**！

---

## ⚙️ 第三步：配置 Railway 环境变量

### 1. 进入 Railway Backend 服务

1. 登录 [Railway](https://railway.app)
2. 进入你的项目
3. 点击 **Backend** 服务
4. 点击 **Variables** 标签

### 2. 添加 OAuth 环境变量

点击 **Raw Editor**，添加以下变量：

```env
# Google OAuth
GOOGLE_CLIENT_ID=你的Google客户端ID
GOOGLE_CLIENT_SECRET=你的Google客户端密钥
GOOGLE_CALLBACK_URL=https://aitodolist-production.up.railway.app/api/auth/google/callback

# GitHub OAuth
GITHUB_CLIENT_ID=你的GitHub客户端ID
GITHUB_CLIENT_SECRET=你的GitHub客户端密钥
GITHUB_CALLBACK_URL=https://aitodolist-production.up.railway.app/api/auth/github/callback
```

### 3. 保存并重新部署

1. 点击 **Save**
2. Railway 会自动重新部署
3. 等待部署完成

---

## 🗄️ 第四步：更新数据库 Schema

需要在数据库中添加 `googleId` 和 `githubId` 字段。

### 方法一：使用 Railway CLI

```bash
# 连接到 Railway 数据库
railway run psql

# 执行 SQL
ALTER TABLE users ADD COLUMN IF NOT EXISTS "googleId" VARCHAR UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "githubId" VARCHAR UNIQUE;

# 更新枚举类型
ALTER TYPE users_logintype_enum ADD VALUE IF NOT EXISTS 'google';
ALTER TYPE users_logintype_enum ADD VALUE IF NOT EXISTS 'github';

# 退出
\q
```

### 方法二：使用 Railway Console

1. 进入 Railway Postgres 服务
2. 点击 **Data** 标签
3. 点击 **Query** 按钮
4. 执行以下 SQL：

```sql
-- 添加新字段
ALTER TABLE users ADD COLUMN IF NOT EXISTS "googleId" VARCHAR UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "githubId" VARCHAR UNIQUE;

-- 更新枚举类型（如果失败，说明已存在，可以忽略）
ALTER TYPE users_logintype_enum ADD VALUE IF NOT EXISTS 'google';
ALTER TYPE users_logintype_enum ADD VALUE IF NOT EXISTS 'github';
```

---

## ✅ 第五步：测试 OAuth 登录

### 1. 访问前端

访问你的 Vercel 前端域名：
```
https://your-vercel-domain.vercel.app/login
```

### 2. 测试 Google 登录

1. 点击 **Google 登录** 按钮
2. 会跳转到 Google 授权页面
3. 选择账号并授权
4. 应该自动跳转回应用并登录成功

### 3. 测试 GitHub 登录

1. 点击 **GitHub 登录** 按钮
2. 会跳转到 GitHub 授权页面
3. 点击 **Authorize** 授权
4. 应该自动跳转回应用并登录成功

---

## 🐛 常见问题排查

### 问题 1：重定向 URI 不匹配

**错误信息**：
```
redirect_uri_mismatch
```

**解决方案**：
1. 检查 Google/GitHub OAuth 应用中配置的回调 URL
2. 确保与 Railway 环境变量中的 `CALLBACK_URL` 完全一致
3. 确保使用 HTTPS（Railway 自动提供）

### 问题 2：OAuth 应用未验证

**Google 显示**：
```
此应用未经验证
```

**解决方案**：
- 开发阶段：点击 **高级** → **转到 TodoMaster（不安全）**
- 生产环境：需要提交 Google 应用验证（需要几周时间）

### 问题 3：数据库字段不存在

**错误信息**：
```
column "googleId" does not exist
```

**解决方案**：
确保执行了第四步的数据库更新 SQL。

### 问题 4：CORS 错误

**错误信息**：
```
Access to XMLHttpRequest has been blocked by CORS policy
```

**解决方案**：
1. 确认 Railway 的 `FRONTEND_URL` 环境变量已配置
2. 确认 Vercel 域名在 Google/GitHub OAuth 应用的授权域中

---

## 📝 环境变量完整清单

### Railway Backend 必需变量

```env
# 数据库
DATABASE_URL=${{Postgres.DATABASE_URL}}

# JWT
JWT_SECRET=你的JWT密钥
JWT_EXPIRES_IN=7d

# 环境
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://your-vercel-domain.vercel.app

# Google OAuth
GOOGLE_CLIENT_ID=你的Google客户端ID
GOOGLE_CLIENT_SECRET=你的Google客户端密钥
GOOGLE_CALLBACK_URL=https://aitodolist-production.up.railway.app/api/auth/google/callback

# GitHub OAuth
GITHUB_CLIENT_ID=你的GitHub客户端ID
GITHUB_CLIENT_SECRET=你的GitHub客户端密钥
GITHUB_CALLBACK_URL=https://aitodolist-production.up.railway.app/api/auth/github/callback

# AI（可选）
ZHIPU_API_KEY=你的智谱API密钥
```

---

## 🎯 本地开发配置

如果需要在本地测试 OAuth：

### 1. 创建 `backend/.env`

```env
GOOGLE_CLIENT_ID=你的Google客户端ID
GOOGLE_CLIENT_SECRET=你的Google客户端密钥
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

GITHUB_CLIENT_ID=你的GitHub客户端ID
GITHUB_CLIENT_SECRET=你的GitHub客户端密钥
GITHUB_CALLBACK_URL=http://localhost:3000/api/auth/github/callback

FRONTEND_URL=http://localhost:5173
```

### 2. 在 OAuth 应用中添加本地回调 URL

**Google**：
```
http://localhost:3000/api/auth/google/callback
```

**GitHub**：
```
http://localhost:3000/api/auth/github/callback
```

---

## 🔒 安全建议

1. ⚠️ **永远不要**将 Client Secret 提交到 Git
2. ⚠️ 定期轮换 OAuth 密钥
3. ⚠️ 生产环境使用 HTTPS
4. ⚠️ 限制 OAuth 应用的授权域
5. ⚠️ 监控异常登录活动

---

## 📚 相关文档

- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [GitHub OAuth Apps](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [Passport.js](http://www.passportjs.org/)
- [NestJS Passport](https://docs.nestjs.com/security/authentication)

---

最后更新：2026-01-05

