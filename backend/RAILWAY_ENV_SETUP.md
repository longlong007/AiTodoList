# Railway 环境变量配置指南

## 📋 必需的环境变量

在 Railway 后端服务中配置以下环境变量：

### 1. 数据库连接（推荐使用 DATABASE_URL）

**方式一：使用 Railway 引用（推荐）**

```
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

这会自动引用同项目中 PostgreSQL 服务的连接 URL。

**方式二：手动配置（当前数据库信息）**

```
DATABASE_URL=postgresql://postgres:bDevxOCwymBozJDmWEXIktaeKbGWZOVl@postgres.railway.internal:5432/railway
```

### 2. JWT 配置

```
JWT_SECRET=your-super-secret-jwt-key-change-in-production-use-long-random-string
JWT_EXPIRES_IN=7d
```

⚠️ **重要**：请生成一个强随机字符串作为 JWT_SECRET

生成方法：
```bash
# Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# PowerShell
[Convert]::ToBase64String((1..64 | ForEach-Object { Get-Random -Maximum 256 }))
```

### 3. AI 服务配置（如果使用智谱 AI）

```
ZHIPU_API_KEY=your-zhipu-api-key-here
```

如果不使用 AI 功能，可以设置为空：
```
ZHIPU_API_KEY=
```

### 4. 环境配置

```
NODE_ENV=production
PORT=3000
```

## 🚀 在 Railway 控制台配置步骤

### 步骤 1：进入后端服务

1. 登录 Railway
2. 进入你的项目
3. 点击 **Backend** 服务（Node.js 服务）

### 步骤 2：添加环境变量

1. 点击 **Variables** 标签
2. 点击 **+ New Variable** 或 **Raw Editor**

### 步骤 3：使用 Raw Editor 批量添加（推荐）

点击 **Raw Editor**，粘贴以下内容：

```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=请生成并替换为你的随机字符串
JWT_EXPIRES_IN=7d
ZHIPU_API_KEY=你的智谱API密钥或留空
NODE_ENV=production
PORT=3000
```

### 步骤 4：保存并重新部署

1. 点击 **Save**
2. Railway 会自动触发重新部署
3. 在 **Deployments** 标签查看部署进度

## ✅ 验证配置

### 1. 查看部署日志

在 **Deployments** → 最新部署 → **Build Logs** 和 **Deploy Logs**

成功的日志应该显示：
```
✓ Database connected successfully
✓ Application is running on port 3000
```

### 2. 测试健康检查

如果你的应用有健康检查端点：
```bash
curl https://your-backend.railway.app/api/health
```

### 3. 测试数据库连接

尝试登录 API：
```bash
curl -X POST https://your-backend.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123456"}'
```

## 🔧 当前数据库连接信息

根据你提供的信息：

```
PGHOST=postgres.railway.internal
PGPORT=5432
PGUSER=postgres
PGPASSWORD=bDevxOCwymBozJDmWEXIktaeKbGWZOVl
PGDATABASE=railway
```

完整的 DATABASE_URL：
```
DATABASE_URL=postgresql://postgres:bDevxOCwymBozJDmWEXIktaeKbGWZOVl@postgres.railway.internal:5432/railway
```

## 📝 代码已配置的功能

✅ 支持 `DATABASE_URL` 优先（Railway 推荐）
✅ 支持独立环境变量备用（本地开发）
✅ 自动启用 SSL（生产环境）
✅ 自动禁用 synchronize（防止数据丢失）
✅ 根据环境启用/禁用日志

## ⚠️ 重要提醒

1. **DATABASE_URL 引用**：`${{Postgres.DATABASE_URL}}` 会自动同步数据库密码变化
2. **JWT_SECRET**：必须使用强随机字符串，不要使用默认值
3. **synchronize=false**：代码已设置，确保数据库 schema 稳定
4. **SSL**：生产环境自动启用，Railway 需要此配置
5. **NODE_ENV**：必须设置为 `production`

## 🐛 常见问题

### Q1: 连接超时或无法连接数据库

**解决方案**：
- 检查 DATABASE_URL 是否正确
- 确认 PostgreSQL 服务在同一 Railway 项目中
- 使用 `postgres.railway.internal` 而不是公网域名

### Q2: SSL 错误

**解决方案**：
- 确保 `NODE_ENV=production`
- 代码已配置 `rejectUnauthorized: false`

### Q3: 应用启动后立即崩溃

**解决方案**：
- 查看 Deploy Logs
- 检查所有必需的环境变量是否已设置
- 确认数据库表结构已创建（运行 schema.sql）

## 📚 相关文档

- [Railway 文档](https://docs.railway.app/)
- [NestJS TypeORM](https://docs.nestjs.com/techniques/database)
- [PostgreSQL SSL](https://www.postgresql.org/docs/current/ssl-tcp.html)

---

最后更新：2026-01-05

