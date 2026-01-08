# 数据库一键安装指南

最快速的方式搭建 TodoList 数据库环境。

## ⚡ 快速安装（3 步完成）

### 步骤 1：创建数据库

```bash
# 连接 PostgreSQL
psql -U postgres

# 创建数据库
CREATE DATABASE todolist;

# 退出
\q
```

### 步骤 2：运行一键安装脚本

**Windows:**
```cmd
cd database
setup-all.bat
```

**Linux/Mac:**
```bash
cd database
chmod +x setup-all.sh
./setup-all.sh
```

输入数据库密码后，脚本将自动：
- ✅ 创建所有表结构
- ✅ 导入测试数据
- ✅ 显示测试账号

### 步骤 3：启动后端服务

```bash
cd backend
npm install
npm run start:dev
```

## 🎯 完成！

现在可以使用以下测试账号登录：

| 邮箱 | 密码 | 账户类型 | 用途 |
|------|------|---------|------|
| free@test.com | test123456 | 免费用户 | 测试基础功能 |
| pro@test.com | test123456 | Pro 用户 | 测试 AI 分析 |
| chinese@test.com | test123456 | Pro 用户 | 100条中文待办 |

也可以使用手机号登录：
- **手机号**: 13800138000
- **密码**: test123456

## 🔧 高级配置

### 自定义数据库连接

使用环境变量：

**Windows:**
```cmd
set DB_HOST=localhost
set DB_PORT=5432
set DB_NAME=todolist
set DB_USER=postgres
setup-all.bat
```

**Linux/Mac:**
```bash
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=todolist
export DB_USER=postgres
./setup-all.sh
```

### 使用 Docker PostgreSQL

```bash
# 启动 PostgreSQL 容器
docker run -d \
  --name postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  postgres:15

# 等待容器启动（约 10 秒）
sleep 10

# 创建数据库
docker exec -it postgres psql -U postgres -c "CREATE DATABASE todolist;"

# 运行安装脚本
cd database
./setup-all.sh
```

## 📊 安装内容

### 数据库表

| 表名 | 说明 | 字段数 |
|------|------|--------|
| users | 用户表 | 12 |
| todos | 待办事项表 | 10 |
| orders | 订单表 | 11 |
| reports | AI 分析报告表 | 9 |

### 测试数据

| 数据类型 | 数量 | 说明 |
|---------|------|------|
| 用户 | 5 | 包含免费和 Pro 用户 |
| 待办事项 | 290 | 覆盖各种状态和优先级 |
| 订单 | 5 | 包含已支付和待支付 |

### 新功能支持

- ✅ OAuth 登录（Google, GitHub）
- ✅ PDF 报告生成和存储
- ✅ 对象存储集成（pdfUrl, pdfKey）

## 🐛 常见问题

### Q: 提示 "database todolist does not exist"

**解决：** 先创建数据库
```bash
psql -U postgres -c "CREATE DATABASE todolist;"
```

### Q: 提示 "psql: command not found"

**解决：** 安装 PostgreSQL 客户端

**Windows:**
- 下载并安装 [PostgreSQL](https://www.postgresql.org/download/windows/)
- 添加到 PATH: `C:\Program Files\PostgreSQL\15\bin`

**macOS:**
```bash
brew install postgresql@15
```

**Ubuntu/Debian:**
```bash
sudo apt-get install postgresql-client
```

### Q: 密码认证失败

**解决：** 检查 PostgreSQL 密码

**Linux/Mac:**
```bash
export PGPASSWORD=your_password
./setup-all.sh
```

**Windows:**
```cmd
set PGPASSWORD=your_password
setup-all.bat
```

### Q: 想要保留现有数据

**解决：** 使用迁移脚本而不是一键安装

```bash
# 仅添加 PDF 字段（不删除数据）
cd database
psql -U postgres -d todolist -f add-report-pdf-fields.sql
```

## 🔄 重置数据库

```bash
cd database
./setup-all.sh  # 会提示确认
```

## 📚 相关文档

- [DATABASE_MIGRATION_FIX.md](../doc/DATABASE_MIGRATION_FIX.md) - 迁移问题排查
- [OBJECT_STORAGE_GUIDE.md](../doc/OBJECT_STORAGE_GUIDE.md) - 对象存储配置
- [QUICK_START_DATABASE.md](../doc/QUICK_START_DATABASE.md) - 详细数据库指南

---

最后更新：2026-01-08
