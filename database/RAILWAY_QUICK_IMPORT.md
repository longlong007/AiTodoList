# Railway 数据库快速导入指南

## 🚀 三种快速导入方法

### 方法 1: 使用提供的导入脚本 ⭐ 推荐

#### Windows 系统

1. **获取 Railway 数据库连接信息**
   - 登录 [Railway.app](https://railway.app)
   - 进入你的项目，找到 PostgreSQL 服务
   - 点击 **Variables** 或 **Connect** 标签
   - 复制连接信息

2. **修改配置**
   
   编辑 `database/railway-import.bat`，修改这些变量：
   
   ```batch
   set RAILWAY_DB_HOST=xxxxx.railway.app
   set RAILWAY_DB_PORT=5432
   set RAILWAY_DB_USER=postgres
   set RAILWAY_DB_NAME=railway
   set RAILWAY_DB_PASSWORD=你的密码
   ```

3. **执行导入**
   
   ```cmd
   cd database
   railway-import.bat
   ```

#### Linux/Mac 系统

1. **修改配置**
   
   编辑 `database/railway-import.sh`，修改连接信息（同上）

2. **添加执行权限并运行**
   
   ```bash
   cd database
   chmod +x railway-import.sh
   ./railway-import.sh
   ```

---

### 方法 2: 使用 Railway CLI ⭐ 最简单

如果你已经安装了 Railway CLI：

```bash
# 1. 确保已登录并链接到项目
railway login
railway link

# 2. 进入 database 目录
cd database

# 3. 使用 Railway CLI 执行 SQL 文件
railway run psql -f schema.sql
railway run psql -f seed.sql

# 完成！
```

**安装 Railway CLI:**

Windows:
```powershell
iwr https://railway.app/install.ps1 -useb | iex
```

Mac/Linux:
```bash
curl -fsSL https://railway.app/install.sh | sh
```

---

### 方法 3: 使用 DATABASE_URL 一行命令

如果你有完整的 `DATABASE_URL`：

```bash
# Windows
set DATABASE_URL=postgresql://postgres:password@host:port/railway
psql %DATABASE_URL% -f schema.sql
psql %DATABASE_URL% -f seed.sql

# Linux/Mac
export DATABASE_URL="postgresql://postgres:password@host:port/railway"
psql $DATABASE_URL -f schema.sql
psql $DATABASE_URL -f seed.sql
```

---

## 📋 导入前检查清单

- [ ] 已在 Railway 创建 PostgreSQL 数据库
- [ ] 已安装 `psql` 命令（或使用 Railway CLI）
- [ ] 已获取数据库连接信息
- [ ] 已备份现有数据（如果有）
- [ ] 理解此操作会删除所有现有表

---

## ✅ 验证导入成功

导入完成后，使用以下命令验证：

### 使用 Railway CLI

```bash
railway psql
```

### 使用 psql 命令

```bash
psql -h your-host -U postgres -d railway
```

### 在 psql 中执行

```sql
-- 查看所有表
\dt

-- 应该看到: users, todos, orders, reports

-- 查看用户数量
SELECT COUNT(*) FROM users;
-- 应该返回: 5

-- 查看待办数量
SELECT COUNT(*) FROM todos;
-- 应该返回: 约 25 条

-- 查看订单数量
SELECT COUNT(*) FROM orders;
-- 应该返回: 5

-- 退出
\q
```

---

## 🧪 测试账号

导入成功后，你可以使用以下测试账号登录：

| 邮箱/手机 | 密码 | 类型 | 说明 |
|----------|------|------|------|
| `free@test.com` | `test123456` | 免费用户 | 基础功能 |
| `13800138000` | `test123456` | Pro用户 | 有效期1年 |
| `pro@test.com` | `test123456` | Pro用户 | 5天后过期 |
| `expired@test.com` | `test123456` | 已过期 | Pro已过期 |

---

## ⚠️ 常见问题

### 问题 1: `psql: command not found`

**解决方案:**
- Windows: 安装 [PostgreSQL](https://www.postgresql.org/download/windows/)
- Mac: `brew install postgresql`
- Ubuntu: `sudo apt-get install postgresql-client`
- 或使用 Railway CLI（推荐）

### 问题 2: 连接超时或拒绝

**解决方案:**
1. 检查连接信息是否正确
2. 确认 Railway 数据库服务正在运行
3. 尝试使用 Railway CLI
4. 检查网络连接

### 问题 3: 密码认证失败

**解决方案:**
1. 从 Railway 重新复制密码（注意特殊字符）
2. 如果密码包含特殊字符，尝试使用 `DATABASE_URL` 方式
3. 或使用 Railway CLI（自动处理认证）

### 问题 4: 中文乱码

**解决方案:**
- 脚本已设置 `UTF8` 编码，应该不会出现此问题
- 如果仍有问题，确保终端支持 UTF-8

---

## 📚 详细文档

更多详细信息和高级用法，请参阅：

- [RAILWAY_IMPORT_GUIDE.md](./RAILWAY_IMPORT_GUIDE.md) - 完整导入指南
- [QUICK_SETUP.md](./QUICK_SETUP.md) - 本地数据库设置
- [Railway 官方文档](https://docs.railway.app/databases/postgresql)

---

## 🎯 快速参考

### 只导入结构（不导入测试数据）

```bash
# 方法 1: 使用脚本
# 编辑脚本，注释掉 seed.sql 部分

# 方法 2: 使用 Railway CLI
railway run psql -f schema.sql

# 方法 3: 使用 psql
psql -h host -U postgres -d railway -f schema.sql
```

### 重新导入（清空并重建）

```bash
# 直接运行导入脚本即可，schema.sql 包含 DROP TABLE 语句
railway-import.bat  # Windows
./railway-import.sh # Linux/Mac
```

### 备份现有数据

```bash
# 使用 Railway CLI
railway run pg_dump > backup.sql

# 使用 pg_dump
pg_dump -h host -U postgres -d railway > backup.sql
```

---

## 💡 提示

1. **首次部署**: 直接运行导入脚本即可
2. **开发环境**: 可以多次重新导入测试数据
3. **生产环境**: 谨慎使用，建议使用数据库迁移工具
4. **推荐工具**: Railway CLI 是最简单可靠的方式

---

需要帮助？查看 [完整导入指南](./RAILWAY_IMPORT_GUIDE.md) 或 Railway 官方文档。
