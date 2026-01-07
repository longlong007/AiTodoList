-- 添加 PDF 存储相关字段到 reports 表
-- 用于支持对象存储 (OSS/COS/S3)

-- 添加 pdfUrl 字段 - 存储 PDF 在对象存储中的访问 URL
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS "pdfUrl" VARCHAR NULL;

-- 添加 pdfKey 字段 - 存储 PDF 在对象存储中的键名（用于删除）
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS "pdfKey" VARCHAR NULL;

-- 添加注释
COMMENT ON COLUMN reports."pdfUrl" IS 'PDF 文件在对象存储中的 URL';
COMMENT ON COLUMN reports."pdfKey" IS 'PDF 文件在对象存储中的键名（用于删除）';

-- 查看更新后的表结构
\d reports;

