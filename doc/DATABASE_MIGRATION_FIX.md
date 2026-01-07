# 数据库迁移问题修复指南

## 问题描述

执行 `add-report-pdf-fields.bat` 时遇到以下错误：

1. **关系 "reports" 不存在** - reports 表还未创建
2. **编码错误** - 字符编码问题（已修复）

## 解决方案

### 方案一：仅添加 PDF 字段（推荐 - 如果 reports 表已存在）

如果你之前已经创建了 reports 表，只需执行：

```bash
cd database
psql -U postgres -d todolist -f add-report-pdf-fields.sql
```

输入密码后，应该看到成功信息。

### 方案二：完整的数据库初始化（如果 reports 表不存在）

如果 reports 表不存在，需要先创建完整的数据库结构：

**步骤 1：创建完整数据库结构**

```bash
cd database
psql -U postgres -d todolist -f schema.sql
```

这将创建所有表，包括：
- users (用户表)
- todos (待办事项表)
- orders (订单表)
- reports (报告表，已包含 PDF 字段)

**步骤 2：导入测试数据（可选）**

```bash
psql -U postgres -d todolist -f seed.sql
```

### 方案三：手动执行 SQL

如果批处理脚本有问题，可以手动执行 SQL：

```bash
# 连接到数据库
psql -U postgres -d todolist

# 在 psql 提示符下执行
ALTER TABLE reports ADD COLUMN IF NOT EXISTS "pdfUrl" VARCHAR NULL;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS "pdfKey" VARCHAR NULL;

# 退出
\q
```

## 验证迁移是否成功

执行以下命令查看 reports 表结构：

```bash
psql -U postgres -d todolist -c "\d reports"
```

应该看到类似输出：

```
                          Table "public.reports"
    Column      |            Type             | Collation | Nullable |      Default
----------------+-----------------------------+-----------+----------+------------------
 id             | uuid                        |           | not null | gen_random_uuid()
 title          | character varying           |           | not null |
 content        | text                        |           | not null |
 statisticsData | text                        |           |          |
 pdfUrl         | character varying           |           |          |
 pdfKey         | character varying           |           |          |
 userId         | uuid                        |           | not null |
 createdAt      | timestamp without time zone |           | not null | now()
 updatedAt      | timestamp without time zone |           | not null | now()
```

关键是要看到 `pdfUrl` 和 `pdfKey` 两个字段。

## 常见问题

### Q1: psql 命令找不到

**错误：** `'psql' 不是内部或外部命令`

**解决：** 需要安装 PostgreSQL 客户端或将其添加到 PATH。

1. 找到 PostgreSQL 安装目录（通常在 `C:\Program Files\PostgreSQL\15\bin`）
2. 将该目录添加到系统 PATH 环境变量
3. 重启命令行窗口

### Q2: 密码认证失败

**错误：** `用户 "postgres" Password 认证失败`

**解决：** 检查 PostgreSQL 密码配置：

1. 找到 `pg_hba.conf` 文件（通常在 PostgreSQL 数据目录）
2. 确保有以下配置：
   ```
   host    all             all             127.0.0.1/32            md5
   ```
3. 重启 PostgreSQL 服务

或者使用环境变量设置密码：

```bash
set PGPASSWORD=your-password
psql -U postgres -d todolist -f schema.sql
set PGPASSWORD=
```

### Q3: 数据库不存在

**错误：** `database "todolist" does not exist`

**解决：** 先创建数据库：

```bash
psql -U postgres -c "CREATE DATABASE todolist;"
```

然后再执行 schema.sql。

### Q4: 表已存在但缺少 PDF 字段

**情况：** 你之前已经创建了 reports 表，但没有 pdfUrl 和 pdfKey 字段

**解决：** 

**方法 1 - 执行迁移脚本（推荐）：**
```bash
cd database
psql -U postgres -d todolist -f add-report-pdf-fields.sql
```

**方法 2 - 手动添加字段：**
```sql
-- 连接数据库
psql -U postgres -d todolist

-- 添加字段
ALTER TABLE reports ADD COLUMN IF NOT EXISTS "pdfUrl" VARCHAR NULL;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS "pdfKey" VARCHAR NULL;

-- 验证
\d reports

-- 退出
\q
```

## 完整操作流程示例

假设你是第一次设置数据库：

```bash
# 1. 切换到 database 目录
cd D:\GitCode\MyTools\full_web_demo_cursor\database

# 2. 创建数据库（如果不存在）
psql -U postgres -c "CREATE DATABASE todolist;"

# 3. 创建所有表（已包含 PDF 字段）
psql -U postgres -d todolist -f schema.sql

# 4. 导入测试数据（可选）
psql -U postgres -d todolist -f seed.sql

# 5. 验证 reports 表结构
psql -U postgres -d todolist -c "\d reports"
```

如果 reports 表已存在但缺少 PDF 字段：

```bash
# 1. 切换到 database 目录
cd D:\GitCode\MyTools\full_web_demo_cursor\database

# 2. 添加 PDF 字段
psql -U postgres -d todolist -f add-report-pdf-fields.sql

# 3. 验证字段已添加
psql -U postgres -d todolist -c "\d reports"
```

## 测试对象存储功能

迁移成功后，重启后端服务：

```bash
cd backend
npm run start:dev
```

应该看到：
- ✅ 已初始化对象存储客户端（如果配置了）
- 新的路由 `/api/reports/:id/generate-pdf` 已注册

## 需要帮助？

如果仍然遇到问题，请检查：

1. PostgreSQL 服务是否正在运行
2. 数据库 todolist 是否存在
3. 用户 postgres 的密码是否正确
4. psql 命令是否可用（`psql --version`）

或者参考项目文档：
- `doc/QUICK_START_DATABASE.md` - 数据库快速入门
- `doc/OBJECT_STORAGE_GUIDE.md` - 对象存储配置指南

