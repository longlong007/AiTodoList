# AI 分析报告保存和 PDF 下载功能

## 🎯 功能概述

为 AI 智能分析功能添加了以下新特性：

1. **保存报告** - 将生成的 AI 分析报告保存到数据库
2. **下载 PDF** - 将保存的报告导出为 PDF 文件
3. **历史报告** - 查看、管理所有历史保存的报告

---

## 📋 功能清单

### ✅ 已实现功能

1. **后端功能**
   - ✅ Report 数据库实体和表结构
   - ✅ Report Service（CRUD 操作）
   - ✅ Report Controller（RESTful API）
   - ✅ PDF 生成服务（使用 pdfkit）
   - ✅ 用户权限验证

2. **前端功能**
   - ✅ 保存报告按钮
   - ✅ 下载 PDF 按钮
   - ✅ 历史报告列表模态框
   - ✅ 查看历史报告
   - ✅ 删除历史报告
   - ✅ 报告 API 接口

3. **数据库**
   - ✅ reports 表
   - ✅ 外键关联到 users 表
   - ✅ 自动更新时间戳触发器

---

## 🗄️ 数据库结构

### reports 表

```sql
CREATE TABLE "reports" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "title" VARCHAR NOT NULL,
    "content" TEXT NOT NULL,
    "statisticsData" TEXT,  -- JSON 格式的统计数据快照
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT "FK_reports_userId" FOREIGN KEY ("userId") 
        REFERENCES "users"("id") ON DELETE CASCADE
);
```

---

## 🔌 API 接口

### 1. 创建报告

```
POST /api/reports
Authorization: Bearer <token>

Request Body:
{
  "title": "AI分析报告 - 2026-01-07",
  "content": "## 您的待办事项分析...",
  "statisticsData": "{...}"  // 可选
}

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "...",
    "content": "...",
    "userId": "uuid",
    "createdAt": "2026-01-07T...",
    "updatedAt": "2026-01-07T..."
  }
}
```

### 2. 获取所有报告

```
GET /api/reports
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "...",
      "content": "...",
      "createdAt": "...",
      ...
    }
  ]
}
```

### 3. 获取单个报告

```
GET /api/reports/:id
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "...",
    "content": "...",
    ...
  }
}
```

### 4. 删除报告

```
DELETE /api/reports/:id
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "报告已删除"
}
```

### 5. 下载 PDF

```
GET /api/reports/:id/pdf
Authorization: Bearer <token>

Response:
Content-Type: application/pdf
Content-Disposition: attachment; filename="report-{id}.pdf"

[PDF Binary Data]
```

---

## 💻 前端使用

### 1. 生成和保存报告

```typescript
// 生成 AI 分析
const { data } = await aiApi.analyze()
analysis.value = data.analysis

// 保存报告
await reportApi.create({
  title: `AI分析报告 - ${new Date().toLocaleDateString('zh-CN')}`,
  content: analysis.value,
  statisticsData: JSON.stringify(stats.value),
})
```

### 2. 查看历史报告

```typescript
// 获取历史报告列表
const { data } = await reportApi.getAll()
historicalReports.value = data.data

// 查看某个报告
const report = await reportApi.getOne(reportId)
analysis.value = report.content
```

### 3. 下载 PDF

```typescript
const { data } = await reportApi.downloadPdf(reportId)

// 创建下载链接
const url = window.URL.createObjectURL(new Blob([data]))
const link = document.createElement('a')
link.href = url
link.setAttribute('download', `report-${reportId}.pdf`)
document.body.appendChild(link)
link.click()
link.remove()
window.URL.revokeObjectURL(url)
```

---

## 📦 依赖包

### 后端新增依赖

```json
{
  "pdfkit": "^0.15.0",
  "@types/pdfkit": "^0.13.4"
}
```

### 安装命令

```bash
cd backend
npm install pdfkit
npm install --save-dev @types/pdfkit
```

---

## 🚀 部署步骤

### 1. 更新数据库

在 Railway 或本地数据库执行：

```bash
# 本地开发
cd database
psql -U postgres -d todolist -f schema.sql

# 或使用 Railway CLI
railway run psql -f database/schema.sql
```

### 2. 安装后端依赖

```bash
cd backend
npm install
```

### 3. 重启后端服务

```bash
# 本地开发
npm run start:dev

# 生产环境（Railway 会自动重新部署）
git push origin main
```

### 4. 前端部署

Vercel 会自动检测到新的提交并重新部署。

---

## 🎨 UI 功能说明

### 分析页面按钮

1. **刷新分析** - 重新生成 AI 分析报告
2. **历史报告** - 打开历史报告列表模态框
3. **保存报告** - 保存当前显示的分析报告
4. **下载 PDF** - 下载已保存的报告为 PDF 文件

### 历史报告模态框

- **查看** 👁️ - 在主页面显示该报告内容
- **下载** 📥 - 下载该报告为 PDF
- **删除** 🗑️ - 删除该报告

---

## 📄 PDF 格式

生成的 PDF 包含：

1. **标题** - "AI智能分析报告"
2. **报告标题** - 用户保存时的标题
3. **生成时间** - 报告创建时间
4. **报告内容** - 解析 Markdown 格式为纯文本
   - 二级标题（##）
   - 三级标题（###）
   - 列表项（-）
   - 普通文本
5. **页脚** - 页码和 "Powered by AI TodoList"

---

## 🔒 权限控制

- ✅ 所有报告 API 都需要 JWT 认证
- ✅ 用户只能访问自己的报告
- ✅ 删除用户时级联删除其所有报告

---

## 🐛 错误处理

### 常见错误

1. **报告不存在** (404)
   ```json
   {
     "statusCode": 404,
     "message": "报告不存在"
   }
   ```

2. **未认证** (401)
   ```json
   {
     "statusCode": 401,
     "message": "Unauthorized"
   }
   ```

3. **PDF 生成失败** (500)
   ```json
   {
     "statusCode": 500,
     "message": "PDF 生成失败"
   }
   ```

---

## 📁 文件结构

### 后端

```
backend/src/
├── report/
│   ├── entities/
│   │   └── report.entity.ts       # Report 实体
│   ├── dto/
│   │   └── create-report.dto.ts   # 创建报告 DTO
│   ├── report.service.ts          # 报告服务
│   ├── report.controller.ts       # 报告控制器
│   ├── pdf.service.ts             # PDF 生成服务
│   └── report.module.ts           # 报告模块
└── app.module.ts                  # 导入 ReportModule
```

### 前端

```
frontend/src/
├── api/
│   └── report.ts                  # 报告 API 接口
└── views/
    └── Analysis.vue               # 分析页面（已更新）
```

### 数据库

```
database/
└── schema.sql                     # 更新了 reports 表
```

---

## 🎯 使用流程

### 完整流程示例

1. **用户访问分析页面**
   ```
   用户 → /analysis → 自动生成 AI 分析
   ```

2. **用户查看分析结果**
   ```
   显示统计图表和 AI 分析报告
   ```

3. **用户保存报告**
   ```
   点击"保存报告" → POST /api/reports → 保存成功
   ```

4. **用户下载 PDF**
   ```
   点击"下载 PDF" → GET /api/reports/:id/pdf → 下载文件
   ```

5. **用户查看历史报告**
   ```
   点击"历史报告" → GET /api/reports → 显示列表
   点击某个报告 → 查看内容
   ```

6. **用户删除报告**
   ```
   点击删除按钮 → DELETE /api/reports/:id → 删除成功
   ```

---

## 🔄 未来优化方向

### 可能的增强功能

1. **报告导出格式**
   - Word 文档（.docx）
   - Markdown 文件（.md）
   - HTML 页面

2. **报告分享**
   - 生成分享链接
   - 设置分享有效期
   - 公开/私有设置

3. **报告对比**
   - 对比不同时期的报告
   - 显示趋势变化

4. **报告模板**
   - 自定义报告格式
   - 预设多种模板

5. **自动生成报告**
   - 定时生成（每周/每月）
   - 邮件发送报告

6. **报告统计**
   - 报告数量统计
   - 存储空间统计

---

## ⚠️ 注意事项

1. **PDF 生成**
   - 当前使用 pdfkit，不支持复杂的 Markdown 渲染
   - 中文字符可能需要额外配置字体

2. **存储空间**
   - 报告内容存储在数据库中
   - 建议定期清理旧报告

3. **性能考虑**
   - PDF 生成是 CPU 密集型操作
   - 大量并发可能影响性能

4. **安全性**
   - 所有报告都需要认证
   - 确保用户只能访问自己的报告

---

最后更新：2026-01-07

