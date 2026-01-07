# PDF 对象存储配置指南

本指南介绍如何配置对象存储服务（OSS/COS/S3）来存储生成的分析报告 PDF 文件。

## 📋 功能概述

- ✅ 支持阿里云 OSS、腾讯云 COS、AWS S3 及兼容 S3 的存储
- ✅ 自动生成并上传 PDF 到对象存储
- ✅ 自动文件路径组织（按年/月/用户）
- ✅ 删除报告时自动清理对象存储文件
- ✅ 支持手动触发 PDF 生成和上传

## 🚀 快速开始

### 1. 数据库迁移

首先需要添加 PDF 存储相关的字段到数据库：

**Windows:**
```bash
cd database
add-report-pdf-fields.bat
```

**Linux/macOS:**
```bash
cd database
chmod +x add-report-pdf-fields.sh
./add-report-pdf-fields.sh
```

**手动执行 SQL:**
```sql
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS "pdfUrl" VARCHAR NULL,
ADD COLUMN IF NOT EXISTS "pdfKey" VARCHAR NULL;
```

### 2. 选择对象存储服务

根据你的需求选择一个对象存储服务：

| 服务 | 适用场景 | 月费用（约） |
|------|---------|------------|
| 阿里云 OSS | 国内用户 | ¥0.12/GB |
| 腾讯云 COS | 国内用户 | ¥0.11/GB |
| AWS S3 | 国际用户 | $0.023/GB |
| MinIO | 自建存储 | 免费 |

---

## 📦 阿里云 OSS 配置

### 1. 创建 OSS Bucket

1. 访问 [阿里云 OSS 控制台](https://oss.console.aliyun.com/)
2. 点击 **创建 Bucket**
3. 填写信息：
   - **Bucket 名称**: 例如 `my-app-reports`
   - **区域**: 选择离用户最近的区域（如 `华东1-杭州`）
   - **读写权限**: 私有（推荐）或公共读
   - **存储类型**: 标准存储
4. 点击 **确定**

### 2. 创建访问密钥

1. 点击右上角头像 → **AccessKey 管理**
2. 点击 **创建 AccessKey**
3. 保存 **AccessKey ID** 和 **AccessKey Secret**

### 3. 配置环境变量

在 `backend/.env` 中添加：

```env
STORAGE_TYPE=oss

OSS_REGION=oss-cn-hangzhou
OSS_ACCESS_KEY_ID=你的AccessKeyID
OSS_ACCESS_KEY_SECRET=你的AccessKeySecret
OSS_BUCKET=my-app-reports
```

---

## 🐧 腾讯云 COS 配置

### 1. 创建 COS Bucket

1. 访问 [腾讯云 COS 控制台](https://console.cloud.tencent.com/cos)
2. 点击 **创建存储桶**
3. 填写信息：
   - **名称**: 例如 `my-app-reports`
   - **所属地域**: 选择离用户最近的区域（如 `广州`）
   - **访问权限**: 私有读写（推荐）或公有读私有写
4. 点击 **创建**

### 2. 创建密钥

1. 访问 [API 密钥管理](https://console.cloud.tencent.com/cam/capi)
2. 点击 **新建密钥**
3. 保存 **SecretId** 和 **SecretKey**

### 3. 配置环境变量

在 `backend/.env` 中添加：

```env
STORAGE_TYPE=cos

COS_SECRET_ID=你的SecretId
COS_SECRET_KEY=你的SecretKey
COS_REGION=ap-guangzhou
COS_BUCKET=my-app-reports-1234567890
COS_BASE_URL=https://my-app-reports-1234567890.cos.ap-guangzhou.myqcloud.com
```

---

## ☁️ AWS S3 配置

### 1. 创建 S3 Bucket

1. 访问 [AWS S3 控制台](https://s3.console.aws.amazon.com/)
2. 点击 **Create bucket**
3. 填写信息：
   - **Bucket name**: 例如 `my-app-reports`
   - **Region**: 选择区域（如 `us-east-1`）
   - **Block Public Access**: 全部勾选（推荐）
4. 点击 **Create bucket**

### 2. 创建 IAM 用户和访问密钥

1. 访问 [IAM 控制台](https://console.aws.amazon.com/iam/)
2. 点击 **Users** → **Add users**
3. 创建用户并附加策略 `AmazonS3FullAccess`
4. 生成访问密钥，保存 **Access Key ID** 和 **Secret Access Key**

### 3. 配置环境变量

在 `backend/.env` 中添加：

```env
STORAGE_TYPE=s3

S3_REGION=us-east-1
S3_ACCESS_KEY_ID=你的AccessKeyID
S3_SECRET_ACCESS_KEY=你的SecretAccessKey
S3_BUCKET=my-app-reports
```

---

## 🏠 MinIO（自建 S3 兼容存储）

### 1. 安装 MinIO

**Docker 方式:**
```bash
docker run -d \
  -p 9000:9000 \
  -p 9001:9001 \
  --name minio \
  -e "MINIO_ROOT_USER=admin" \
  -e "MINIO_ROOT_PASSWORD=your-password" \
  -v /data/minio:/data \
  minio/minio server /data --console-address ":9001"
```

### 2. 创建 Bucket

1. 访问 `http://localhost:9001`
2. 登录（admin / your-password）
3. 点击 **Buckets** → **Create Bucket**
4. 输入名称 `reports`
5. 设置访问策略为 `public` 或 `private`

### 3. 创建访问密钥

1. 点击 **Access Keys** → **Create Access Key**
2. 保存生成的 Access Key 和 Secret Key

### 4. 配置环境变量

在 `backend/.env` 中添加：

```env
STORAGE_TYPE=s3

S3_REGION=us-east-1
S3_ACCESS_KEY_ID=你的AccessKey
S3_SECRET_ACCESS_KEY=你的SecretKey
S3_BUCKET=reports
S3_ENDPOINT=http://localhost:9000
S3_FORCE_PATH_STYLE=true
```

---

## 🔧 使用说明

### API 接口

#### 1. 创建报告（自动生成 PDF）

```bash
POST /api/reports
Authorization: Bearer <token>

{
  "title": "本周分析报告",
  "content": "# 报告内容\n\n本周完成 10 个任务..."
}
```

创建报告后，系统会自动在后台生成 PDF 并上传到对象存储。

#### 2. 手动触发 PDF 生成

```bash
POST /api/reports/:id/generate-pdf
Authorization: Bearer <token>
```

响应：
```json
{
  "success": true,
  "message": "PDF 已生成并上传",
  "data": {
    "pdfUrl": "https://bucket.oss.region.com/reports/2026/01/user-id/report-id.pdf"
  }
}
```

#### 3. 下载 PDF

```bash
GET /api/reports/:id/pdf
Authorization: Bearer <token>
```

如果对象存储中有 PDF，会重定向到对象存储 URL；否则实时生成。

#### 4. 删除报告（自动删除 PDF）

```bash
DELETE /api/reports/:id
Authorization: Bearer <token>
```

删除报告时会自动删除对象存储中的 PDF 文件。

---

## 📁 文件路径组织

上传到对象存储的文件路径格式：

```
reports/{年}/{月}/{用户ID}/{报告ID}.pdf
```

示例：
```
reports/2026/01/user-123/abc-def-456.pdf
```

---

## 🐛 常见问题

### 问题 1：上传失败 - 权限错误

**错误信息：**
```
AccessDenied: Access Denied
```

**解决方案：**
1. 检查 AccessKey 是否正确
2. 检查 IAM 用户是否有 S3 写权限
3. 检查 Bucket 的访问策略

### 问题 2：连接超时

**错误信息：**
```
RequestTimeout: Your socket connection to the server was not read from or written to within the timeout period
```

**解决方案：**
1. 检查网络连接
2. 检查 Region 配置是否正确
3. 尝试更换区域

### 问题 3：Bucket 不存在

**错误信息：**
```
NoSuchBucket: The specified bucket does not exist
```

**解决方案：**
1. 确认 Bucket 名称拼写正确
2. 确认 Bucket 在配置的 Region 中
3. 确认 Bucket 已创建

### 问题 4：MinIO 连接失败

**解决方案：**
1. 确保 `S3_FORCE_PATH_STYLE=true`
2. 检查 `S3_ENDPOINT` 是否正确
3. 确认 MinIO 服务正在运行

---

## 💰 成本估算

假设每个 PDF 文件大小为 500KB，每月生成 1000 个报告：

| 服务 | 存储成本（月） | 请求成本（月） | 总计 |
|------|--------------|--------------|------|
| 阿里云 OSS | ¥0.06 | ¥0.01 | **¥0.07** |
| 腾讯云 COS | ¥0.055 | ¥0.01 | **¥0.065** |
| AWS S3 | $0.012 | $0.005 | **$0.017** |
| MinIO | 免费 | 免费 | **免费** |

---

## 🔒 安全建议

1. ✅ 使用私有 Bucket，通过签名 URL 访问
2. ✅ 定期轮换访问密钥
3. ✅ 限制 IAM 用户权限（最小权限原则）
4. ✅ 启用 Bucket 版本控制（防止误删除）
5. ✅ 配置生命周期规则（自动删除过期文件）
6. ✅ 启用访问日志记录

---

## 📚 参考文档

- [阿里云 OSS 文档](https://help.aliyun.com/product/31815.html)
- [腾讯云 COS 文档](https://cloud.tencent.com/document/product/436)
- [AWS S3 文档](https://docs.aws.amazon.com/s3/)
- [MinIO 文档](https://min.io/docs/minio/linux/index.html)

---

最后更新：2026-01-07

