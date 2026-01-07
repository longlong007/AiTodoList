-- Add PDF storage fields to reports table
-- Support for Object Storage (OSS/COS/S3)

-- Add pdfUrl field
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS "pdfUrl" VARCHAR NULL;

-- Add pdfKey field
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS "pdfKey" VARCHAR NULL;

-- Add comments
COMMENT ON COLUMN reports."pdfUrl" IS 'PDF file URL in object storage';
COMMENT ON COLUMN reports."pdfKey" IS 'PDF file key in object storage for deletion';

-- Show updated table structure
\d reports;

