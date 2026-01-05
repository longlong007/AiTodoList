# Railway 部署指南

## ✅ 已完成的配置

根据 [Railpack 文档](https://railpack.com/getting-started)，已完成以下配置：

1. ✅ **Procfile** - 定义启动命令
   ```
   web: npm run start:prod
   ```

2. ✅ **railway.json** - Railway 配置
   ```json
   {
     "build": {
       "builder": "RAILPACK"
     },
     "deploy": {
       "restartPolicyType": "ON_FAILURE",
       "restartPolicyMaxRetries": 10
     }
   }
   ```

3. ✅ **package.json** - 添加了 engines 字段
   ```json
   {
     "engines": {
       "node": ">=18.0.0",
       "npm": ">=9.0.0"
     }
   }
   ```

## 部署方式

### 方式一：使用 Railway 网页控制台（推荐，最简单）

1. 登录 [Railway.app](https://railway.app)
2. 点击 "New Project"
3. 选择 "Deploy from GitHub repo"
4. 选择你的仓库
5. **重要**：设置 Root Directory 为 `backend`
6. Railway 会自动检测到 Procfile 和 railway.json
7. 配置环境变量（见下文）
8. 等待部署完成

### 方式二：使用 Railway CLI

#### 1. 安装 Railway CLI

**Windows (PowerShell):**
```powershell
iwr https://railway.app/install.ps1 -useb | iex
```

**Mac/Linux:**
```bash
curl -fsSL https://railway.app/install.sh | sh
```

#### 2. 登录
```bash
railway login
```

#### 3. 初始化项目（在 backend 目录）
```bash
cd backend
railway init
```

#### 4. 配置环境变量
```bash
railway variables set DB_HOST=your-db-host
railway variables set DB_PORT=5432
railway variables set DB_USERNAME=postgres
railway variables set DB_PASSWORD=your-password
railway variables set DB_DATABASE=todolist
railway variables set JWT_SECRET=$(openssl rand -base64 64)
railway variables set ZHIPU_API_KEY=your-api-key
railway variables set PORT=3000
```

#### 5. 部署
```bash
railway up
```

#### 6. 获取部署 URL
```bash
railway domain
```

## 环境变量配置

在 Railway 控制台或使用 CLI 配置以下环境变量：

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `DB_HOST` | 数据库主机 | `db.xxx.supabase.co` |
| `DB_PORT` | 数据库端口 | `5432` |
| `DB_USERNAME` | 数据库用户名 | `postgres` |
| `DB_PASSWORD` | 数据库密码 | `your-password` |
| `DB_DATABASE` | 数据库名称 | `todolist` |
| `JWT_SECRET` | JWT 密钥 | 生成强随机字符串 |
| `ZHIPU_API_KEY` | 智谱 API 密钥 | `your-api-key` |
| `PORT` | 服务端口 | `3000` |

## Railpack 构建流程

根据 [Railpack Node.js 文档](https://railpack.com/languages/node)，Railpack 会：

1. 检测 `package.json` 识别 Node.js 项目
2. 读取 `engines` 字段确定 Node 版本
3. 运行 `npm install` 安装依赖
4. 运行 `npm run build` 构建项目（如果有 build script）
5. 读取 `Procfile` 确定启动命令
6. 启动应用：`npm run start:prod`

## 验证部署

部署成功后：

```bash
# 1. 检查状态
railway status

# 2. 查看日志
railway logs

# 3. 测试 API
curl https://your-app.railway.app/api

# 4. 测试注册接口
curl -X POST https://your-app.railway.app/api/auth/register/email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","nickname":"Test"}'
```

## 故障排查

### 问题：Railpack 无法识别项目

**原因**：缺少 Procfile 或 package.json

**解决**：
- ✅ 已创建 Procfile
- ✅ 已配置 package.json

### 问题：构建失败

**解决**：查看构建日志
```bash
railway logs --build
```

### 问题：启动失败

**原因**：环境变量未配置或数据库连接失败

**解决**：
1. 检查所有环境变量是否配置
2. 测试数据库连接
3. 查看运行日志：`railway logs`

## 切换到 Dockerfile 构建（备选方案）

如果 Railpack 仍有问题，可以切换到使用 Dockerfile：

修改 `railway.json`：
```json
{
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  }
}
```

项目已经有 Dockerfile，可以直接使用。

## 参考文档

- [Railpack 入门](https://railpack.com/getting-started)
- [Railpack Node.js 支持](https://railpack.com/languages/node)
- [Railpack Procfile 配置](https://railpack.com/configuration/procfile)
- [Railway 文档](https://docs.railway.app)

## 部署成功检查清单

- [ ] Procfile 已创建
- [ ] railway.json 配置正确
- [ ] package.json 包含 engines 字段
- [ ] 提交并推送代码到 Git
- [ ] 在 Railway 设置 Root Directory 为 `backend`
- [ ] 配置所有环境变量
- [ ] 数据库已准备就绪
- [ ] 部署成功并获得 URL
- [ ] API 测试通过

