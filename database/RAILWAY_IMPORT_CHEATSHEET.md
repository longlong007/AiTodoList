# Railway 数据库导入速查表 🚀

> 一页纸搞定 Railway 数据库导入

---

## 📋 准备工作（5分钟）

### 1️⃣ 在 Railway 创建 PostgreSQL 数据库

```
Railway 控制台 → 你的项目 → + New → Database → PostgreSQL
```

### 2️⃣ 获取连接信息

在 PostgreSQL 服务页面，点击 **Variables** 或 **Connect** 标签，复制：

```
PGHOST=xxxxx.railway.app
PGPORT=5432
PGUSER=postgres
PGPASSWORD=xxxxxxxxxxxxxx
PGDATABASE=railway
```

或完整的 `DATABASE_URL`:
```
postgresql://postgres:password@xxxxx.railway.app:5432/railway
```

---

## 🎯 三种导入方法（任选其一）

### 方法 A: Railway CLI ⭐ 最简单，零配置

```bash
# 1. 安装 Railway CLI（首次使用）
# Windows PowerShell:
iwr https://railway.app/install.ps1 -useb | iex

# Mac/Linux:
curl -fsSL https://railway.app/install.sh | sh

# 2. 登录并链接项目
railway login
railway link

# 3. 进入 database 目录并导入
cd database
railway run psql -f schema.sql
railway run psql -f seed.sql

# ✅ 完成！
```

**优点**: 
- ✅ 零配置，不需要手动输入连接信息
- ✅ 自动处理认证
- ✅ 最可靠的方法

---

### 方法 B: 使用提供的脚本 ⭐ 可重复使用

#### Windows 系统

```cmd
cd database

REM 1. 用记事本编辑 railway-import.bat
notepad railway-import.bat

REM 2. 修改这些变量（第17-21行）:
REM set RAILWAY_DB_HOST=xxxxx.railway.app
REM set RAILWAY_DB_PORT=5432
REM set RAILWAY_DB_USER=postgres
REM set RAILWAY_DB_NAME=railway
REM set RAILWAY_DB_PASSWORD=你的密码

REM 3. 保存并运行
railway-import.bat

REM ✅ 完成！
```

#### Linux/Mac 系统

```bash
cd database

# 1. 编辑导入脚本
nano railway-import.sh  # 或使用 vim/vi

# 2. 修改这些变量（第14-18行）:
# RAILWAY_DB_HOST="xxxxx.railway.app"
# RAILWAY_DB_PORT="5432"
# RAILWAY_DB_USER="postgres"
# RAILWAY_DB_NAME="railway"
# RAILWAY_DB_PASSWORD="你的密码"

# 3. 保存，添加执行权限并运行
chmod +x railway-import.sh
./railway-import.sh

# ✅ 完成！
```

**优点**: 
- ✅ 配置一次，重复使用
- ✅ 适合团队共享（不包含密码的版本）
- ✅ 有详细的错误提示

---

### 方法 C: 使用 DATABASE_URL 一行命令 ⭐ 最快速

**前提**: 已安装 `psql` 命令

#### Windows (CMD)

```cmd
cd database
set DATABASE_URL=postgresql://postgres:password@xxxxx.railway.app:5432/railway
psql %DATABASE_URL% -f schema.sql
psql %DATABASE_URL% -f seed.sql
```

#### Linux/Mac

```bash
cd database
export DATABASE_URL="postgresql://postgres:password@xxxxx.railway.app:5432/railway"
psql $DATABASE_URL -f schema.sql
psql $DATABASE_URL -f seed.sql
```

**优点**: 
- ✅ 最快速，适合临时使用
- ✅ 适合有经验的开发者

---

## ✅ 验证导入成功（1分钟）

### 使用 Railway CLI

```bash
railway psql
```

### 使用 psql 命令

```bash
psql postgresql://postgres:password@xxxxx.railway.app:5432/railway
```

### 在 psql 中检查

```sql
-- 查看所有表（应该看到 4 个表）
\dt

-- 查看用户数量（应该是 5）
SELECT COUNT(*) FROM users;

-- 查看待办事项数量（应该是 25 左右）
SELECT COUNT(*) FROM todos;

-- 查看订单数量（应该是 5）
SELECT COUNT(*) FROM orders;

-- 查看测试账号
SELECT email, phone, "accountType", "subscriptionStatus" FROM users;

-- 退出
\q
```

**预期结果**:
```
✓ 4 张表: users, todos, orders, reports
✓ 5 个用户（2个免费，3个Pro）
✓ ~25 条待办事项
✓ 5 条订单记录
```

---

## 🧪 测试账号

| 登录方式 | 账号 | 密码 | 类型 |
|---------|------|------|------|
| 邮箱 | `free@test.com` | `test123456` | 免费用户 |
| 手机 | `13800138000` | `test123456` | Pro用户（1年） |
| 邮箱 | `pro@test.com` | `test123456` | Pro用户（5天后过期） |
| 邮箱 | `expired@test.com` | `test123456` | 已过期Pro |

---

## ⚠️ 常见问题 30秒解决

### ❌ `psql: command not found`

**解决**: 使用 Railway CLI（方法A），或安装 PostgreSQL 客户端

```bash
# Mac
brew install postgresql

# Ubuntu/Debian
sudo apt-get install postgresql-client

# Windows
# 下载安装: https://www.postgresql.org/download/windows/
```

---

### ❌ 连接超时/拒绝

**解决**: 
1. 检查连接信息是否复制正确
2. 确认 Railway 数据库服务正在运行（Railway 控制台查看）
3. 使用 Railway CLI（最可靠）

---

### ❌ 密码认证失败

**解决**: 
1. 重新从 Railway 复制密码（注意不要有多余空格）
2. 如果密码包含特殊字符，使用 Railway CLI

---

### ❌ 中文乱码

**解决**: 脚本已自动设置 UTF-8，如果仍有问题：

```bash
# Windows CMD
chcp 65001

# 或在 psql 命令中添加
psql ... --set=client_encoding=UTF8
```

---

## 🎯 快速命令参考

```bash
# 安装 Railway CLI
curl -fsSL https://railway.app/install.sh | sh  # Mac/Linux
iwr https://railway.app/install.ps1 -useb | iex # Windows

# Railway CLI 常用命令
railway login              # 登录
railway link               # 链接项目
railway psql               # 连接数据库
railway run psql -f xxx.sql  # 执行SQL文件
railway status             # 查看状态
railway logs               # 查看日志

# 仅导入结构（不导入测试数据）
railway run psql -f schema.sql  # 跳过 seed.sql

# 备份现有数据
railway run pg_dump > backup.sql

# 重新导入（会删除所有数据）
railway run psql -f schema.sql
railway run psql -f seed.sql
```

---

## 📚 更多帮助

- 🚀 [快速导入指南](./RAILWAY_QUICK_IMPORT.md) - 3种方法详解
- 📖 [完整导入指南](./RAILWAY_IMPORT_GUIDE.md) - 详细步骤和问题排查
- 🏠 [数据库说明](./README.md) - 本地部署和测试数据说明
- 🌐 [Railway 官方文档](https://docs.railway.app/databases/postgresql)

---

## 💡 推荐流程

**首次部署** → 使用 Railway CLI（方法A）

**团队协作** → 使用导入脚本（方法B），配置一次重复使用

**快速测试** → 使用 DATABASE_URL（方法C）

---

**最后更新**: 2026-01-09 | **版本**: v1.0
