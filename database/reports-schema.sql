-- 分析报告表
CREATE TABLE IF NOT EXISTS analysis_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    statistics JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_analysis_reports_user_id ON analysis_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_reports_created_at ON analysis_reports(created_at DESC);

-- 添加评论
COMMENT ON TABLE analysis_reports IS 'AI分析报告存储表';
COMMENT ON COLUMN analysis_reports.id IS '报告唯一标识';
COMMENT ON COLUMN analysis_reports.user_id IS '用户ID';
COMMENT ON COLUMN analysis_reports.title IS '报告标题';
COMMENT ON COLUMN analysis_reports.content IS '报告内容（Markdown格式）';
COMMENT ON COLUMN analysis_reports.statistics IS '统计数据（JSON格式）';
COMMENT ON COLUMN analysis_reports.created_at IS '创建时间';
COMMENT ON COLUMN analysis_reports.updated_at IS '更新时间';

