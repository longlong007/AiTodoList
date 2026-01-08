# 🎯 Todo Master - 智能待办管理系统

一个功能完善的待办事项管理系统，采用前后端分离架构，支持 AI 智能分析。

![Tech Stack](https://img.shields.io/badge/Frontend-Vue%203-4FC08D?style=flat-square&logo=vue.js)
![Tech Stack](https://img.shields.io/badge/Backend-NestJS-E0234E?style=flat-square&logo=nestjs)
![Tech Stack](https://img.shields.io/badge/Database-PostgreSQL-4169E1?style=flat-square&logo=postgresql)
![Tech Stack](https://img.shields.io/badge/AI-智谱%20GLM--4-FF6B6B?style=flat-square)

## ✨ 功能特性

- 📝 **待办管理** - 完整的增删改查功能
- 🎯 **重要性分级** - A/B/C/D 四级重要性标记
- ⏰ **紧急程度** - 1-5 五级紧急程度设置
- 📊 **智能排序** - 先按重要性，再按紧急程度排序
- 👤 **多种登录方式** - 支持手机号/邮箱/微信登录
- 🤖 **AI 分析** - 接入智谱 GLM-4 大模型，分析目标完成情况

## 🛠️ 技术栈

### 前端
- Vue 3 + TypeScript
- Vite
- Pinia (状态管理)
- Vue Router
- Tailwind CSS
- Axios

### 后端
- NestJS
- TypeORM
- PostgreSQL
- Redis (缓存和限流)
- JWT 认证
- Passport.js

### AI 集成
- 智谱 GLM-4 大模型

## 🚀 快速开始

### 环境要求

- Node.js >= 18
- PostgreSQL >= 14
- Redis >= 6 (推荐，用于缓存和限流)
- npm 或 yarn

### 方式一：Docker 部署（推荐）

1. 克隆项目
```bash
git clone <repository-url>
cd todolist
```

2. 配置环境变量（可选，用于启用 AI 分析）
```bash
export ZHIPU_API_KEY=your-zhipu-api-key
```

3. 启动服务
```bash
docker-compose up -d
```

4. 访问应用
- 前端：http://localhost
- 后端 API：http://localhost:3000/api

### 方式二：本地开发

#### 1. 启动数据库

```bash
# 使用 Docker 启动 PostgreSQL
docker run -d \
  --name todolist-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=todolist \
  -p 5432:5432 \
  postgres:15-alpine

# 启动 Redis (可选但推荐)
docker run -d \
  --name todolist-redis \
  -p 6379:6379 \
  redis:7-alpine
```

#### 2. 启动后端

```bash
cd backend

# 安装依赖
npm install

# 配置环境变量
cp env.example .env
# 编辑 .env 文件，配置数据库连接和 API Key

# 启动开发服务器
npm run start:dev
```

#### 3. 启动前端

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

#### 4. 访问应用

- 前端：http://localhost:5173
- 后端 API：http://localhost:3000/api

## 📁 项目结构

```
todolist/
├── backend/                 # NestJS 后端
│   ├── src/
│   │   ├── auth/           # 认证模块
│   │   ├── user/           # 用户模块
│   │   ├── todo/           # 待办模块
│   │   ├── ai/             # AI 分析模块
│   │   ├── cache/          # Redis 缓存模块
│   │   ├── common/         # 公共模块（限流等）
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── package.json
│   ├── REDIS_GUIDE.md      # Redis 使用指南
│   └── Dockerfile
├── frontend/               # Vue3 前端
│   ├── src/
│   │   ├── api/           # API 接口
│   │   ├── stores/        # Pinia 状态管理
│   │   ├── views/         # 页面组件
│   │   ├── router/        # 路由配置
│   │   ├── types/         # TypeScript 类型
│   │   └── main.ts
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## 📖 API 文档

### 认证接口

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /api/auth/register/email | 邮箱注册 |
| POST | /api/auth/register/phone | 手机号注册 |
| POST | /api/auth/login/email | 邮箱登录 |
| POST | /api/auth/login/phone | 手机号登录 |
| POST | /api/auth/login/wechat | 微信登录 |

### 待办接口

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/todos | 获取待办列表 |
| POST | /api/todos | 创建待办 |
| GET | /api/todos/:id | 获取待办详情 |
| PUT | /api/todos/:id | 更新待办 |
| DELETE | /api/todos/:id | 删除待办 |
| GET | /api/todos/statistics | 获取统计数据 |

### AI 接口

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/ai/analyze | 获取 AI 分析报告 |

## ⚙️ 配置说明

### Redis 配置（推荐）

Redis 用于缓存和限流，可显著提升性能：
- 数据库查询减少 60-80%
- API响应速度提升 40-60%
- AI API调用费用减少 70-90%

在 `backend/.env` 中配置：
```env
REDIS_URL=redis://localhost:6379/0
```

详细配置请参考：[backend/REDIS_GUIDE.md](backend/REDIS_GUIDE.md)

### 智谱 AI 配置

1. 访问 [智谱 AI 开放平台](https://open.bigmodel.cn/)
2. 注册账号并获取 API Key
3. 在 `.env` 文件中配置：

```env
ZHIPU_API_KEY=your-api-key-here
```

## 📱 功能截图

### 登录页面
- 支持邮箱/手机号登录
- 支持微信扫码登录

### 待办列表
- 四象限优先级管理
- 多维度筛选和排序
- 快速切换完成状态

### AI 分析
- 目标完成情况评估
- 时间管理习惯分析
- 个性化改进建议

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

