# 数据库快速启动指南

本指南帮助你快速导入测试数据并开始使用TodoList项目。

## 🚀 快速开始（3步搞定）

### 步骤1：确保数据库运行

```bash
# 使用Docker启动PostgreSQL（推荐）
docker-compose up -d postgres

# 或使用本地PostgreSQL
# 确保PostgreSQL服务正在运行
```

### 步骤2：导入数据

#### Windows用户

双击运行 `database\import.bat`，选择选项3（完整导入）

或在命令行中：
```cmd
cd database
import.bat
```

#### Linux/Mac用户

```bash
chmod +x database/import.sh
./database/import.sh
```

选择选项 `3) 完整导入`

### 步骤3：登录测试

访问 `http://localhost:5173/login`，使用以下任一账号：

| 账号类型 | 登录账号 | 密码 | 特点 |
|---------|---------|------|------|
| 免费用户 | `free@test.com` | `test123456` | 基础功能 |
| Pro会员 | `13800138000` | `test123456` | 全部功能 |
| Pro会员 | `pro@test.com` | `test123456` | 即将到期 |
| 过期会员 | `expired@test.com` | `test123456` | 需要续费 |

## 📊 导入后你会得到

### 用户数据
- ✅ 5个测试用户（涵盖免费、Pro、过期等各种状态）
- ✅ 真实的密码加密（bcryptjs）
- ✅ 完整的会员信息

### 待办事项
- ✅ 25+ 条待办事项
- ✅ 涵盖 A-D 所有重要性级别
- ✅ 涵盖 1-5 所有紧急程度
- ✅ 包含待处理、进行中、已完成、已取消等所有状态
- ✅ 真实的业务场景数据

### 订单数据
- ✅ 5个订单记录
- ✅ 包含已支付、待支付、已取消等状态
- ✅ 支付宝、微信支付都有

## 🧪 测试场景推荐

### 场景1：免费用户体验
1. 使用 `free@test.com` 登录
2. 查看基础待办功能
3. 尝试访问AI分析 → 提示升级Pro
4. 点击升级，体验支付流程

### 场景2：Pro用户功能
1. 使用 `13800138000` 登录
2. 查看丰富的待办数据（12条）
3. 点击"AI分析"，查看智能分析结果
4. 测试待办事项的增删改查
5. 验证按重要性和紧急程度排序

### 场景3：会员到期提醒
1. 使用 `pro@test.com` 登录
2. 注意待办列表中有"续费Pro会员"任务
3. 5天后会员到期
4. 测试续费流程

### 场景4：过期会员续费
1. 使用 `expired@test.com` 登录
2. 尝试使用AI分析 → 提示会员已过期
3. 点击升级按钮
4. 完成支付后重新获得Pro权限

## 🔄 重置数据

如果测试过程中数据被修改，想恢复到初始状态：

```bash
# 重新运行导入脚本即可
./database/import.sh  # 或 database\import.bat
# 选择选项 3（完整导入）
```

脚本会自动清空现有数据并重新导入。

## ⚙️ 自定义配置

### 修改数据库连接

#### 方式1：环境变量

```bash
# Linux/Mac
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=todolist
export DB_USER=postgres
export DB_PASSWORD=your_password

# Windows PowerShell
$env:DB_HOST="localhost"
$env:DB_PORT="5432"
```

#### 方式2：修改 backend/.env

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=todolist
DB_USERNAME=postgres
DB_PASSWORD=your_password
```

### 使用Docker中的PostgreSQL

如果使用 `docker-compose` 启动的PostgreSQL：

```bash
# 方式1：进入容器导入
docker-compose exec postgres psql -U postgres -d todolist < database/schema.sql
docker-compose exec postgres psql -U postgres -d todolist < database/seed.sql

# 方式2：从宿主机导入
docker exec -i $(docker ps -qf "name=postgres") psql -U postgres -d todolist < database/schema.sql
docker exec -i $(docker ps -qf "name=postgres") psql -U postgres -d todolist < database/seed.sql
```

## 🐛 常见问题

### Q: 提示 "psql: command not found"

**A:** 需要安装PostgreSQL客户端工具：

```bash
# Ubuntu/Debian
sudo apt-get install postgresql-client

# macOS
brew install postgresql

# Windows
# 下载安装PostgreSQL，确保添加到PATH
```

### Q: 密码验证失败

**A:** 检查以下几点：
1. 环境变量 `DB_PASSWORD` 是否设置正确
2. `backend/.env` 文件中的 `DB_PASSWORD` 是否正确
3. 或在运行psql时手动输入密码

### Q: 登录失败

**A:** 确保：
1. 已成功导入数据（检查导入脚本是否报错）
2. 密码使用 `test123456`（注意大小写）
3. 后端服务正在运行

### Q: AI分析无法使用

**A:** 需要配置智谱AI的API Key：
1. 编辑 `backend/.env`
2. 添加：`ZHIPU_API_KEY=your_api_key`
3. 重启后端服务

## 📁 文件说明

```
database/
├── schema.sql                    # 数据库表结构
├── seed.sql                      # 测试数据（已包含真实密码哈希）
├── import.sh                     # Linux/Mac导入脚本
├── import.bat                    # Windows导入脚本
├── README.md                     # 详细文档
└── backend/scripts/
    └── generate-test-passwords.js # 密码生成工具（不需手动运行）
```

## 💡 Pro提示

### 1. 开发时自动重置数据

在 `package.json` 中添加脚本：

```json
{
  "scripts": {
    "db:reset": "psql -U postgres -d todolist -f database/schema.sql && psql -U postgres -d todolist -f database/seed.sql"
  }
}
```

### 2. 备份测试数据

```bash
# 导出数据
pg_dump -U postgres -d todolist > backup.sql

# 恢复数据
psql -U postgres -d todolist < backup.sql
```

### 3. 查看数据统计

导入完成后会自动显示统计信息：
- 用户数（Pro/免费）
- 待办事项数（已完成/待处理）
- 订单数（已支付/待支付）

## 🎯 下一步

数据导入成功后，你可以：

1. ✅ **启动项目**
   ```bash
   # 后端
   cd backend
   npm run start:dev
   
   # 前端
   cd frontend
   npm run dev
   ```

2. ✅ **访问应用**
   - 前端：http://localhost:5173
   - 后端API：http://localhost:3000/api

3. ✅ **开始测试**
   - 使用测试账号登录
   - 测试所有功能
   - 修改代码，立即看到效果

4. ✅ **查看文档**
   - `database/README.md` - 数据库详细文档
   - `PAYMENT_TEST_GUIDE.md` - 支付测试指南
   - `PRO_FEATURE_FIX.md` - Pro功能说明

---

**祝你开发顺利！** 🚀

如有问题，请查看 `database/README.md` 获取更详细的文档。

