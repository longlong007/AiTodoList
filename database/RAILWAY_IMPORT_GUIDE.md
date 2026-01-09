# Railway 平台数据库导入指南

## 📋 概述

本指南详细说明如何将 `schema.sql` 和 `seed.sql` 导入到 Railway 平台的 PostgreSQL 数据库中。

## 🎯 前置准备

### 1. 在 Railway 创建 PostgreSQL 数据库

1. 登录 [Railway.app](https://railway.app)
2. 进入你的项目
3. 点击 **"+ New"** → 选择 **"Database"** → 选择 **"PostgreSQL"**
4. Railway 会自动创建一个 PostgreSQL 数据库实例

### 2. 获取数据库连接信息

在 Railway 的 PostgreSQL 服务页面，找到 **"Connect"** 标签，你会看到：

```
DATABASE_URL=postgresql://postgres:password@host:port/railway
```

或者单独的连接信息：
- `PGHOST`: 数据库主机地址
- `PGPORT`: 端口（通常是 5432）
- `PGUSER`: 用户名（通常是 postgres）
- `PGPASSWORD`: 密码
- `PGDATABASE`: 数据库名（通常是 railway）

## 🚀 方法一：使用本地 psql 命令（推荐）

### Windows 系统

#### 步骤 1：确保已安装 PostgreSQL 客户端

```bash
where psql
```

如果没有安装，请从 [PostgreSQL 官网](https://www.postgresql.org/download/windows/) 下载安装。

#### 步骤 2：创建 Railway 导入脚本

在 `database` 目录创建 `railway-import.bat`：

```batch
@echo off
chcp 65001 >nul
echo ====================================
echo Railway Database Import Tool
echo ====================================
echo.

REM 从Railway获取的数据库连接信息
set RAILWAY_DB_HOST=your-railway-host.railway.app
set RAILWAY_DB_PORT=5432
set RAILWAY_DB_USER=postgres
set RAILWAY_DB_NAME=railway
set RAILWAY_DB_PASSWORD=your-railway-password

echo 连接信息:
echo   Host: %RAILWAY_DB_HOST%
echo   Port: %RAILWAY_DB_PORT%
echo   User: %RAILWAY_DB_USER%
echo   Database: %RAILWAY_DB_NAME%
echo.

echo [WARNING] 这将删除并重建所有表!
echo 所有现有数据将会丢失!
echo.
set /p confirm=确认继续? (Y/N): 
if /i not "%confirm%"=="Y" (
    echo 已取消.
    pause
    exit /b 0
)

echo.
echo ====================================
echo 步骤 1/2: 导入数据库结构...
echo ====================================
set PGCLIENTENCODING=UTF8
set PGOPTIONS=--lc-messages=C
psql -h %RAILWAY_DB_HOST% -p %RAILWAY_DB_PORT% -U %RAILWAY_DB_USER% -d %RAILWAY_DB_NAME% --set=client_encoding=UTF8 -f schema.sql

if %errorlevel% neq 0 (
    echo [ERROR] 导入结构失败
    pause
    exit /b 1
)

echo [SUCCESS] 数据库结构导入成功
echo.

echo ====================================
echo 步骤 2/2: 导入测试数据...
echo ====================================
psql -h %RAILWAY_DB_HOST% -p %RAILWAY_DB_PORT% -U %RAILWAY_DB_USER% -d %RAILWAY_DB_NAME% --set=client_encoding=UTF8 -f seed.sql

if %errorlevel% neq 0 (
    echo [ERROR] 导入测试数据失败
    pause
    exit /b 1
)

echo [SUCCESS] 测试数据导入成功
echo.
echo ====================================
echo 导入完成!
echo ====================================
pause
```

#### 步骤 3：修改连接信息并执行

1. 编辑 `railway-import.bat`，填入从 Railway 获取的真实连接信息
2. 在 `database` 目录执行：

```bash
cd database
railway-import.bat
```

### Linux/Mac 系统

创建 `database/railway-import.sh`：

```bash
#!/bin/bash

echo "===================================="
echo "Railway Database Import Tool"
echo "===================================="
echo

# 从Railway获取的数据库连接信息
RAILWAY_DB_HOST="your-railway-host.railway.app"
RAILWAY_DB_PORT="5432"
RAILWAY_DB_USER="postgres"
RAILWAY_DB_NAME="railway"
RAILWAY_DB_PASSWORD="your-railway-password"

export PGPASSWORD=$RAILWAY_DB_PASSWORD

echo "连接信息:"
echo "  Host: $RAILWAY_DB_HOST"
echo "  Port: $RAILWAY_DB_PORT"
echo "  User: $RAILWAY_DB_USER"
echo "  Database: $RAILWAY_DB_NAME"
echo

echo "[WARNING] 这将删除并重建所有表!"
echo "所有现有数据将会丢失!"
echo
read -p "确认继续? (Y/N): " confirm
if [ "$confirm" != "Y" ] && [ "$confirm" != "y" ]; then
    echo "已取消."
    exit 0
fi

echo
echo "===================================="
echo "步骤 1/2: 导入数据库结构..."
echo "===================================="
psql -h $RAILWAY_DB_HOST -p $RAILWAY_DB_PORT -U $RAILWAY_DB_USER -d $RAILWAY_DB_NAME --set=client_encoding=UTF8 -f schema.sql

if [ $? -ne 0 ]; then
    echo "[ERROR] 导入结构失败"
    exit 1
fi

echo "[SUCCESS] 数据库结构导入成功"
echo

echo "===================================="
echo "步骤 2/2: 导入测试数据..."
echo "===================================="
psql -h $RAILWAY_DB_HOST -p $RAILWAY_DB_PORT -U $RAILWAY_DB_USER -d $RAILWAY_DB_NAME --set=client_encoding=UTF8 -f seed.sql

if [ $? -ne 0 ]; then
    echo "[ERROR] 导入测试数据失败"
    exit 1
fi

echo "[SUCCESS] 测试数据导入成功"
echo
echo "===================================="
echo "导入完成!"
echo "===================================="
```

执行：

```bash
chmod +x railway-import.sh
./railway-import.sh
```

## 🚀 方法二：使用 DATABASE_URL 环境变量

如果你有完整的 `DATABASE_URL`，可以直接使用：

### Windows

```batch
@echo off
set DATABASE_URL=postgresql://postgres:password@host:port/railway

echo 导入数据库结构...
psql %DATABASE_URL% -f schema.sql

echo 导入测试数据...
psql %DATABASE_URL% -f seed.sql

echo 完成!
pause
```

### Linux/Mac

```bash
#!/bin/bash
export DATABASE_URL="postgresql://postgres:password@host:port/railway"

echo "导入数据库结构..."
psql $DATABASE_URL -f schema.sql

echo "导入测试数据..."
psql $DATABASE_URL -f seed.sql

echo "完成!"
```

## 🚀 方法三：使用 Railway CLI

### 步骤 1：安装 Railway CLI

**Windows (PowerShell):**
```powershell
iwr https://railway.app/install.ps1 -useb | iex
```

**Mac/Linux:**
```bash
curl -fsSL https://railway.app/install.sh | sh
```

### 步骤 2：登录并链接项目

```bash
railway login
cd your-project-directory
railway link
```

### 步骤 3：使用 Railway CLI 连接数据库

Railway CLI 提供了一个便捷的命令来连接数据库：

```bash
# 进入数据库目录
cd database

# 导入 schema
railway run psql -f schema.sql

# 导入 seed data
railway run psql -f seed.sql
```

或者打开一个交互式的 psql 会话：

```bash
railway psql
```

然后在 psql 中执行：

```sql
\i schema.sql
\i seed.sql
```

## 🚀 方法四：使用数据库管理工具

### 使用 DBeaver

1. 下载安装 [DBeaver](https://dbeaver.io/download/)
2. 创建新的 PostgreSQL 连接，填入 Railway 的连接信息
3. 连接成功后，右键数据库 → **SQL Editor** → **Execute SQL Script**
4. 依次选择并执行 `schema.sql` 和 `seed.sql`

### 使用 pgAdmin

1. 下载安装 [pgAdmin](https://www.pgadmin.org/download/)
2. 添加新服务器，填入 Railway 的连接信息
3. 连接成功后，右键数据库 → **Query Tool**
4. 点击 **Open File** 按钮，选择 `schema.sql` 执行
5. 再次打开并执行 `seed.sql`

### 使用 TablePlus

1. 下载安装 [TablePlus](https://tableplus.com/)
2. 创建新连接，选择 PostgreSQL，填入连接信息
3. 连接后，点击 **SQL** 按钮
4. 粘贴并执行 `schema.sql` 的内容
5. 再粘贴并执行 `seed.sql` 的内容

## 🔍 验证导入是否成功

### 方法 1：使用 psql 命令

```bash
# 连接到数据库
psql -h your-host -p 5432 -U postgres -d railway

# 查看所有表
\dt

# 查看用户数量
SELECT COUNT(*) FROM users;

# 查看待办事项数量
SELECT COUNT(*) FROM todos;

# 查看订单数量
SELECT COUNT(*) FROM orders;

# 退出
\q
```

### 方法 2：使用 Railway CLI

```bash
railway psql
```

然后执行上面的 SQL 命令。

### 预期结果

如果导入成功，你应该看到：

- **4 张表**: `users`, `todos`, `orders`, `reports`
- **5 个测试用户**
- **约 25 条待办事项**
- **5 条订单记录**

## ⚠️ 常见问题

### 问题 1：连接超时

**原因**：Railway 数据库可能有 IP 白名单限制

**解决**：
1. 检查 Railway 项目设置中的网络配置
2. 确保你的 IP 地址被允许连接
3. 或使用 Railway CLI（它会自动处理认证）

### 问题 2：密码错误

**原因**：密码包含特殊字符需要转义

**解决**：
- 使用 Railway CLI 自动处理
- 或在 DATABASE_URL 中对密码进行 URL 编码
- 或在脚本中使用 `PGPASSFILE` 或 `PGPASSWORD` 环境变量

### 问题 3：编码问题

**原因**：中文字符显示乱码

**解决**：确保使用 UTF-8 编码
```bash
psql ... --set=client_encoding=UTF8
```

在 Windows 中，确保：
```batch
chcp 65001
set PGCLIENTENCODING=UTF8
```

### 问题 4：权限不足

**原因**：用户没有足够的权限

**解决**：确保使用的是 Railway 提供的 postgres 管理员账户

## 🎓 最佳实践

### 生产环境导入

⚠️ **注意**：`schema.sql` 会删除所有现有表！

对于生产环境：

1. **首次部署**：直接运行 `schema.sql` 和 `seed.sql`
2. **已有数据**：
   - 不要运行包含 `DROP TABLE` 的 `schema.sql`
   - 使用数据库迁移工具（如 TypeORM migrations）
   - 或手动执行需要的 ALTER TABLE 语句

### 备份现有数据

在导入前备份：

```bash
# 备份整个数据库
pg_dump -h your-host -U postgres -d railway > backup.sql

# 只备份数据（不包括结构）
pg_dump -h your-host -U postgres -d railway --data-only > backup-data.sql
```

### 仅导入结构（不导入测试数据）

如果只想创建表结构，不需要测试数据：

```bash
psql -h your-host -U postgres -d railway -f schema.sql
# 跳过 seed.sql
```

## 🔗 相关文档

- [Railway 数据库文档](https://docs.railway.app/databases/postgresql)
- [PostgreSQL psql 文档](https://www.postgresql.org/docs/current/app-psql.html)
- [项目本地导入指南](./QUICK_SETUP.md)

## 📞 需要帮助？

如果遇到问题：

1. 查看 Railway 的日志面板
2. 检查数据库连接信息是否正确
3. 确认防火墙或安全组设置
4. 尝试使用 Railway CLI（最可靠）
