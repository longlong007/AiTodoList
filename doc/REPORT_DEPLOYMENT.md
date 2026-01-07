# AI 分析报告功能部署指南

## 🚀 快速部署

### 1. 更新数据库（Railway）

#### 方法一：使用 Railway CLI

```bash
# 连接到 Railway 数据库
railway link

# 执行 schema 更新
railway run psql -f database/schema.sql
```

#### 方法二：使用 Railway Web Console

1. 登录 [Railway Dashboard](https://railway.app/)
2. 选择你的项目
3. 点击 **Postgres** 服务
4. 点击 **Data** 标签
5. 点击 **Query** 按钮
6. 复制并执行以下 SQL：

```sql
-- 创建 reports 表
CREATE TABLE IF NOT EXISTS "reports" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "title" VARCHAR NOT NULL,
    "content" TEXT NOT NULL,
    "statisticsData" TEXT,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT "FK_reports_userId" FOREIGN KEY ("userId") 
        REFERENCES "users"("id") ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS "IDX_reports_userId" ON "reports" ("userId");
CREATE INDEX IF NOT EXISTS "IDX_reports_createdAt" ON "reports" ("createdAt");

-- 创建触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON "reports"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

7. 点击 **Run** 执行

---

### 2. 安装后端依赖

#### Railway 自动安装

Railway 检测到 `package.json` 的变化会自动安装新依赖：
- `pdfkit`
- `@types/pdfkit`

如果需要手动触发：
```bash
git push origin main
```

Railway 会自动：
1. 检测到新的提交
2. 安装依赖 `npm install`
3. 构建应用 `npm run build`
4. 重启服务

#### 本地开发

```bash
cd backend
npm install
npm run start:dev
```

---

### 3. 前端部署

Vercel 会自动检测到新的提交并重新部署，无需手动操作。

#### 验证部署状态

1. 访问 [Vercel Dashboard](https://vercel.com/)
2. 查看最新的部署状态
3. 等待部署完成（通常 1-3 分钟）

---

### 4. 验证功能

#### 检查后端

访问 Railway 后端域名，检查新的 API 端点：

```bash
# 替换为你的 Railway 域名
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://aitodolist-production.up.railway.app/api/reports
```

预期响应：
```json
{
  "success": true,
  "data": []
}
```

#### 检查前端

1. 访问你的 Vercel 前端域名
2. 登录账号（需要 Pro 会员）
3. 访问 **分析** 页面
4. 生成 AI 分析报告
5. 点击 **保存报告** 按钮
6. 点击 **下载 PDF** 按钮
7. 点击 **历史报告** 查看列表

---

## 🔍 问题排查

### 问题 1：数据库连接失败

**错误信息**：
```
TypeORM error: relation "reports" does not exist
```

**解决方法**：
确保 `reports` 表已创建：

```sql
-- 检查表是否存在
SELECT * FROM information_schema.tables 
WHERE table_name = 'reports';

-- 如果不存在，执行创建语句（见上方步骤 1）
```

---

### 问题 2：PDF 下载失败

**错误信息**：
```
Cannot find module 'pdfkit'
```

**解决方法**：

1. 检查 `package.json` 是否包含 `pdfkit`
2. 在 Railway 中手动触发重新部署：
   - 进入 Railway 项目
   - 点击 Backend 服务
   - 点击 **Deploy** → **Redeploy**

---

### 问题 3：前端 API 调用失败

**错误信息**：
```
404 Not Found: /api/reports
```

**解决方法**：

1. 检查后端是否成功部署
2. 检查 `backend/src/app.module.ts` 是否导入了 `ReportModule`
3. 检查 Railway 日志：
   ```bash
   railway logs
   ```

---

### 问题 4：CORS 错误

**错误信息**：
```
Access to XMLHttpRequest has been blocked by CORS policy
```

**解决方法**：

确保 `backend/src/main.ts` 的 CORS 配置正确：

```typescript
app.enableCors({
  origin: (origin, callback) => {
    if (!origin || 
        allowedOrigins.includes(origin) || 
        /\.vercel\.app$/.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

---

## 📊 数据库迁移验证

### 验证 reports 表

```sql
-- 查看表结构
\d reports

-- 查看索引
\di reports*

-- 查看触发器
SELECT tgname FROM pg_trigger WHERE tgrelid = 'reports'::regclass;

-- 测试插入数据
INSERT INTO reports (title, content, "userId")
VALUES ('测试报告', '这是测试内容', '你的用户UUID');

-- 查询数据
SELECT * FROM reports LIMIT 5;
```

---

## 🎯 完整测试流程

### 1. 生成报告

1. 访问 **分析** 页面
2. 等待 AI 分析完成
3. 查看分析结果

### 2. 保存报告

1. 点击 **保存报告** 按钮
2. 等待保存成功提示
3. 刷新页面，确认报告已保存

### 3. 下载 PDF

1. 点击 **下载 PDF** 按钮
2. 等待 PDF 文件下载
3. 打开 PDF 文件查看内容

### 4. 查看历史报告

1. 点击 **历史报告** 按钮
2. 查看报告列表
3. 点击 **查看** 查看报告内容
4. 点击 **下载** 下载 PDF
5. 点击 **删除** 删除报告

---

## 🔐 权限验证

确保以下权限控制正常：

1. ✅ 未登录用户无法访问报告 API
2. ✅ 用户只能访问自己的报告
3. ✅ 非 Pro 用户无法生成分析（现有限制）

---

## 📈 监控建议

### Railway 日志监控

```bash
# 实时查看日志
railway logs --follow

# 查看最近的错误
railway logs | grep ERROR
```

### 关键指标

- API 响应时间
- PDF 生成时间
- 数据库查询性能
- 存储空间使用

---

## 💾 备份建议

定期备份 reports 表：

```bash
# 导出 reports 数据
railway run pg_dump -t reports > reports_backup.sql

# 或使用 Railway Dashboard 的备份功能
```

---

## 🎉 部署完成！

如果以上步骤都成功，功能已经完全部署并可以使用了！

### 下一步

1. 通知用户新功能上线
2. 监控使用情况和性能
3. 收集用户反馈
4. 根据需要优化功能

---

最后更新：2026-01-07

