# 数据库导入文档索引 📚

> 快速找到你需要的导入指南

---

## 🎯 我想...

### 🏠 在本地部署数据库
**推荐文档**: [README.md](./README.md)

- ✅ 详细的本地PostgreSQL安装和配置
- ✅ 一键安装脚本 (`setup-all.bat` / `setup-all.sh`)
- ✅ 测试账号和数据说明
- ✅ 常见问题解答

**快速开始**:
```bash
cd database
./setup-all.sh      # Linux/Mac
setup-all.bat       # Windows
```

---

### ☁️ 部署到 Railway 平台（30秒速查）
**推荐文档**: [RAILWAY_IMPORT_CHEATSHEET.md](./RAILWAY_IMPORT_CHEATSHEET.md) ⭐⭐⭐

- ✅ 一页纸速查表
- ✅ 3种导入方法对比
- ✅ 快速命令参考
- ✅ 常见问题30秒解决

**最快方法（推荐）**:
```bash
# 1. 安装 Railway CLI
curl -fsSL https://railway.app/install.sh | sh

# 2. 登录并导入
railway login
railway link
cd database
railway run psql -f schema.sql
railway run psql -f seed.sql
```

---

### ☁️ 部署到 Railway 平台（5分钟入门）
**推荐文档**: [RAILWAY_QUICK_IMPORT.md](./RAILWAY_QUICK_IMPORT.md) ⭐⭐

- ✅ 3种导入方法的详细步骤
- ✅ 图文并茂的操作指南
- ✅ 验证导入成功的方法
- ✅ 测试账号信息

**涵盖方法**:
1. 使用导入脚本（`railway-import.bat` / `railway-import.sh`）
2. 使用 Railway CLI
3. 使用 DATABASE_URL 直连

---

### ☁️ 部署到 Railway 平台（完整指南）
**推荐文档**: [RAILWAY_IMPORT_GUIDE.md](./RAILWAY_IMPORT_GUIDE.md) ⭐

- ✅ 最详细的导入指南
- ✅ 4种导入方法（含数据库管理工具）
- ✅ 详细的问题排查
- ✅ 生产环境最佳实践
- ✅ 备份和恢复方法

**适合人群**:
- 首次使用 Railway
- 遇到导入问题需要排查
- 需要了解数据库管理工具的使用

---

## 📁 文件清单

### 📄 SQL 文件
| 文件 | 用途 | 说明 |
|------|------|------|
| `schema.sql` | 数据库结构 | 创建所有表和索引 |
| `seed.sql` | 测试数据 | 5个用户，25条待办，5条订单 |
| `add-report-pdf-fields.sql` | 数据库升级 | 仅用于旧版本升级 |

### 🔧 本地导入脚本
| 文件 | 平台 | 用途 |
|------|------|------|
| `setup-all.bat` | Windows | 一键本地安装（推荐） |
| `setup-all.sh` | Linux/Mac | 一键本地安装（推荐） |
| `import.bat` | Windows | 分步导入 |
| `import.sh` | Linux/Mac | 分步导入 |

### ☁️ Railway 导入脚本
| 文件 | 平台 | 用途 |
|------|------|------|
| `railway-import.bat` | Windows | Railway数据库导入 ⭐ |
| `railway-import.sh` | Linux/Mac | Railway数据库导入 ⭐ |

### 🛠️ 工具脚本
| 文件 | 用途 |
|------|------|
| `generate-passwords.js` | 生成bcrypt密码哈希 |

### 📚 文档
| 文档 | 适合场景 | 阅读时长 |
|------|---------|---------|
| [README.md](./README.md) | 本地部署 | 5分钟 |
| [RAILWAY_IMPORT_CHEATSHEET.md](./RAILWAY_IMPORT_CHEATSHEET.md) | Railway速查 | 30秒 |
| [RAILWAY_QUICK_IMPORT.md](./RAILWAY_QUICK_IMPORT.md) | Railway入门 | 5分钟 |
| [RAILWAY_IMPORT_GUIDE.md](./RAILWAY_IMPORT_GUIDE.md) | Railway完整 | 15分钟 |
| [QUICK_SETUP.md](./QUICK_SETUP.md) | 快速上手 | 3分钟 |
| [INDEX.md](./INDEX.md) | 文档索引（本文） | 2分钟 |

---

## 🚀 推荐路线

### 路线 A: 本地开发
```
1. 阅读 README.md
2. 运行 setup-all.bat/sh
3. 开始开发
```

### 路线 B: Railway 部署（经验用户）
```
1. 看 RAILWAY_IMPORT_CHEATSHEET.md（30秒）
2. 选择一种方法执行
3. 完成
```

### 路线 C: Railway 部署（新手用户）
```
1. 阅读 RAILWAY_QUICK_IMPORT.md（5分钟）
2. 按步骤操作
3. 遇到问题查看 RAILWAY_IMPORT_GUIDE.md
```

### 路线 D: 生产环境部署
```
1. 阅读 RAILWAY_IMPORT_GUIDE.md 的"最佳实践"部分
2. 备份现有数据
3. 使用 Railway CLI 导入
4. 验证数据完整性
```

---

## 📊 方法对比

### 本地部署方法对比

| 方法 | 优点 | 缺点 | 推荐度 |
|------|------|------|--------|
| 一键脚本 | 最简单，自动化 | 无法定制 | ⭐⭐⭐⭐⭐ |
| 分步脚本 | 可控性强 | 需要多步操作 | ⭐⭐⭐ |
| 手动执行 | 完全可控 | 最复杂 | ⭐⭐ |

### Railway 部署方法对比

| 方法 | 难度 | 速度 | 可靠性 | 适用场景 |
|------|------|------|--------|---------|
| Railway CLI | ⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 推荐首选 |
| 导入脚本 | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 团队协作 |
| DATABASE_URL | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | 快速测试 |
| GUI工具 | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | 喜欢图形界面 |

---

## 🧪 测试数据概览

### 用户账号（所有密码: `test123456`）

| 账号 | 类型 | 待办数 | 特点 |
|------|------|--------|------|
| `free@test.com` | 免费 | 4条 | 基础功能测试 |
| `13800138000` | Pro | 12条 | 活跃用户，完整数据 |
| `pro@test.com` | Pro | 5条 | 即将到期提醒 |
| `expired@test.com` | 已过期 | 2条 | 功能限制测试 |
| 微信用户 | 免费 | 2条 | OAuth登录测试 |

### 数据覆盖

- ✅ 所有登录方式: 邮箱、手机、微信、Google、GitHub
- ✅ 所有账户类型: 免费、Pro（活跃/过期）
- ✅ 所有待办状态: 待处理、进行中、已完成、已取消
- ✅ 所有重要性级别: A、B、C、D
- ✅ 所有紧急程度: 1-5
- ✅ 所有订单状态: 待支付、已支付、已取消

---

## ❓ 常见问题快速查找

| 问题 | 查看文档 | 章节 |
|------|---------|------|
| psql命令未找到 | 所有文档 | 常见问题 |
| 密码认证失败 | README.md | Q2 |
| 用户无法登录 | README.md | Q3 |
| 中文显示乱码 | README.md | Q5 |
| Railway连接超时 | RAILWAY_IMPORT_GUIDE.md | 问题1 |
| 密码包含特殊字符 | RAILWAY_IMPORT_GUIDE.md | 问题2 |
| 权限不足 | RAILWAY_IMPORT_GUIDE.md | 问题4 |

---

## 🔗 外部资源

- [PostgreSQL 官网](https://www.postgresql.org/)
- [Railway 官方文档](https://docs.railway.app/)
- [Railway CLI 文档](https://docs.railway.app/develop/cli)
- [NestJS TypeORM](https://docs.nestjs.com/techniques/database)

---

## 📞 需要帮助？

1. **查看对应的文档** - 99%的问题都能找到答案
2. **检查常见问题** - 每个文档都有FAQ章节
3. **查看终端错误信息** - 通常会提示具体问题
4. **使用 Railway CLI** - 最可靠的方法，自动处理大部分问题

---

## 🎓 学习路径建议

### 初学者
```
README.md → 运行本地一键脚本 → 熟悉测试数据 → RAILWAY_QUICK_IMPORT.md
```

### 有经验的开发者
```
RAILWAY_IMPORT_CHEATSHEET.md → 选择方法 → 完成部署
```

### 运维人员
```
RAILWAY_IMPORT_GUIDE.md → 了解所有方法 → 选择最适合的方案
```

---

**维护**: 定期更新 | **版本**: v1.0 | **最后更新**: 2026-01-09
