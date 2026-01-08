# 数据库导入乱码与 UUID 错误修复记录

**修复日期**: 2026-01-08  
**问题文件**: `setup-all.bat`, `seed.sql`  
**影响范围**: Windows 环境下执行数据库初始化脚本

---

## 📋 问题描述

在执行 `setup-all.bat` 导入测试数据时出现两个主要问题：

### 问题 1：中文输出乱码
```
类型    | 数量 | Pro用户 | 免费用户
绫诲瀷    | 鏁伴噺 | Pro鐢ㄦ埛 | 鍏嶈垂鐢ㄦ埛  (乱码)
```

### 问题 2：UUID 类型错误
```
ERROR:  invalid input syntax for type uuid: "todo-1-1"
ERROR:  invalid input syntax for type uuid: "order-2-1"
```

---

## 🔍 诊断过程

### 1. 环境检查

通过诊断脚本收集了以下运行时信息：

```json
{
  "consoleCodePage": 65001,  // UTF-8
  "postgresqlVersion": "PostgreSQL 18.1",
  "clientEncoding": "UTF8",
  "serverEncoding": "UTF8",
  "lc_messages": "Chinese (Simplified)_China.936"  // ⚠️ 问题根源
}
```

### 2. FILTER 语法测试
测试 `COUNT(*) FILTER (WHERE ...)` 语法：
- **结果**: ✅ 成功（exitCode: 0）
- **结论**: PostgreSQL 版本支持此语法，不是语法问题

### 3. 编码测试
在不同代码页下测试中文输出：
- **chcp 936 (GBK)**: 显示乱码
- **chcp 65001 (UTF-8)**: 仍显示乱码
- **原因**: PostgreSQL `lc_messages` 使用 GBK，但控制台为 UTF-8

### 4. 实际导入测试
```
exitCode: 0  (成功执行)
output: "绫诲瀷 | 鏁伴噺 | Pro鐢ㄦ埛..."  (乱码但数据正确)
```

**关键发现**: SQL 实际执行成功，只是输出编码不匹配！

---

## 🎯 根本原因分析

### 原因 1：PostgreSQL lc_messages 编码不匹配

**问题链条**:
```
PostgreSQL lc_messages = GBK (936)
         ↓
错误消息 & 查询结果使用 GBK 编码
         ↓
Windows 控制台期待 UTF-8 (chcp 65001)
         ↓
GBK 字节被误解析为 UTF-8 → 乱码
```

**证据**:
- Log #4: `lc_messages = "Chinese (Simplified)_China.936"`
- Log #6: 输出乱码但 `exitCode = 0`

### 原因 2：UUID 类型定义与测试数据不匹配

**schema.sql** (表定义):
```sql
CREATE TABLE "todos" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ...
);

CREATE TABLE "orders" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ...
);
```

**seed.sql** (旧版测试数据):
```sql
INSERT INTO "todos" ("id", ...) VALUES 
('todo-1-1', ...),  -- ❌ 不是有效的 UUID
('todo-2-1', ...);

INSERT INTO "orders" ("id", ...) VALUES 
('order-2-1', ...);  -- ❌ 不是有效的 UUID
```

**PostgreSQL 错误**:
```
ERROR:  invalid input syntax for type uuid: "todo-1-1"
```

---

## ✅ 修复方案

### 修复 1：强制 PostgreSQL 使用英文消息

**文件**: `database/setup-all.bat`

**修改前**:
```batch
set PGCLIENTENCODING=UTF8
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% --set=client_encoding=UTF8 -f schema.sql
```

**修改后**:
```batch
set PGCLIENTENCODING=UTF8
set PGOPTIONS=--lc-messages=C
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% --set=client_encoding=UTF8 -f schema.sql
```

**说明**:
- `PGOPTIONS=--lc-messages=C` 强制使用 C locale（英文，ASCII）
- 英文消息不会有编码问题
- 同时应用于 `setup-all.sh` (Linux/Mac)

### 修复 2：统一 UUID 格式

**文件**: `database/seed.sql`

**修改前**:
```sql
-- Todos
('todo-1-1', '学习Vue3基础', ...),
('todo-2-1', '紧急修复Bug', ...),

-- Orders
('order-2-1', 'ORD202601010001', ...),
('order-3-1', 'ORD202510150001', ...),
```

**修改后**:
```sql
-- Todos (用户1-5的待办事项)
('10000000-0000-0000-0000-000000000001', '学习Vue3基础', ...),
('20000000-0000-0000-0000-000000000001', '紧急修复Bug', ...),
('30000000-0000-0000-0000-000000000001', '准备年度报告', ...),
('40000000-0000-0000-0000-000000000001', '考虑重新订阅', ...),
('50000000-0000-0000-0000-000000000001', '体验Pro功能', ...),

-- Orders (订单1-5)
('a0000000-0000-0000-0000-000000000001', 'ORD202601010001', ...),
('a0000000-0000-0000-0000-000000000002', 'ORD202510150001', ...),
('a0000000-0000-0000-0000-000000000003', 'ORD202509010001', ...),
('a0000000-0000-0000-0000-000000000004', 'ORD202601030001', ...),
('a0000000-0000-0000-0000-000000000005', 'ORD202601040001', ...),
```

**UUID 命名规则**:
- Todos: `{用户ID}0000000-0000-0000-0000-{序号12位}`
  - 用户1: `10000000-...-00000001`
  - 用户2: `20000000-...-00000001`
- Orders: `a0000000-0000-0000-0000-{序号12位}`
  - 统一前缀 `a`，便于识别订单

---

## 🧪 验证结果

### 执行命令
```bash
cd database
.\setup-all.bat
```

### 输出结果（修复后）

**Step 1: Creating database structure**
```
DROP TABLE
DROP TABLE
...
CREATE TABLE
CREATE INDEX
...
[SUCCESS] Database structure created
```

**Step 2: Importing test data**
```
TRUNCATE TABLE
INSERT 0 1
INSERT 0 1
...
    类型    | 数量 | Pro用户 | 免费用户  ✅ 不再乱码
------------+------+---------+----------
 用户数     |    5 |       3 |        2
 待办事项数 |   23 |      23 |        0
 订单数     |    5 |       3 |        2
(3 rows)

[SUCCESS] Test data imported
```

### 验证要点

✅ **编码问题已解决**
- 中文正常显示
- 表头、统计数据完全可读
- 无乱码字符

✅ **UUID 错误已解决**
- 所有 INSERT 语句成功执行
- 23 个待办事项全部插入
- 5 个订单全部插入
- 无类型错误

✅ **数据完整性**
- 5 个测试用户
- 23 个待办事项（分布在5个用户）
- 5 个订单（涵盖 pending、paid、cancelled 状态）

---

## 📚 技术要点总结

### PostgreSQL 编码相关参数

| 参数 | 说明 | 影响范围 |
|------|------|----------|
| `client_encoding` | 客户端字符编码 | SQL 语句、查询结果 |
| `server_encoding` | 服务器字符编码 | 数据库存储 |
| `lc_messages` | 错误消息语言 | 错误/提示消息 |

**最佳实践**:
- 统一使用 UTF-8：`client_encoding=UTF8`, `server_encoding=UTF8`
- 跨平台脚本：`PGOPTIONS=--lc-messages=C` (英文消息)
- Windows 批处理：`chcp 65001` + `PGCLIENTENCODING=UTF8`

### PostgreSQL UUID 类型

**标准格式**: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` (36 字符)
- 8-4-4-4-12 个十六进制数字
- 用 `-` 分隔

**常见错误**:
```sql
-- ❌ 错误：字符串不是 UUID 格式
INSERT INTO table VALUES ('id-1', ...);

-- ✅ 正确：标准 UUID 格式
INSERT INTO table VALUES ('10000000-0000-0000-0000-000000000001', ...);

-- ✅ 正确：自动生成
INSERT INTO table (name) VALUES ('test');  -- id 自动生成
```

---

## 🔧 相关文件修改清单

| 文件 | 修改类型 | 说明 |
|------|---------|------|
| `setup-all.bat` | 修改 | 添加 `PGOPTIONS=--lc-messages=C` |
| `setup-all.sh` | 修改 | 添加 `PGOPTIONS="--lc-messages=C"` |
| `seed.sql` | 修改 | 所有 ID 改为标准 UUID 格式 |
| `BUGFIX_ENCODING_UUID.md` | 新增 | 本修复记录文档 |

---

## 💡 预防措施

### 1. 初始化脚本编码规范
- ✅ 所有 `.bat` 文件开头添加 `chcp 65001`
- ✅ 所有 psql 命令设置 `PGOPTIONS=--lc-messages=C`
- ✅ 显式设置 `PGCLIENTENCODING=UTF8`

### 2. 测试数据规范
- ✅ UUID 字段使用标准格式
- ✅ 提供命名规则方便识别
- ✅ 数据库类型与测试数据保持一致

### 3. 文档规范
- ✅ 记录已知问题和解决方案
- ✅ 提供环境配置说明
- ✅ 更新 README 添加编码注意事项

---

## 📖 参考资料

- [PostgreSQL: Character Set Support](https://www.postgresql.org/docs/current/multibyte.html)
- [PostgreSQL: UUID Type](https://www.postgresql.org/docs/current/datatype-uuid.html)
- [Windows Code Page 65001 (UTF-8)](https://docs.microsoft.com/en-us/windows/console/console-code-pages)

---

**修复完成**: ✅  
**测试通过**: ✅  
**文档更新**: ✅
