-- ============================================
-- TodoList 测试数据
-- ============================================

-- 清空现有数据
TRUNCATE TABLE "orders" CASCADE;
TRUNCATE TABLE "todos" CASCADE;
TRUNCATE TABLE "users" CASCADE;

-- ============================================
-- 1. 插入测试用户
-- ============================================

-- 用户1: 免费用户（邮箱登录）
-- 密码: test123456
INSERT INTO "users" 
("id", "email", "password", "nickname", "loginType", "accountType", "subscriptionStatus", "createdAt", "updatedAt")
VALUES 
('11111111-1111-1111-1111-111111111111', 
 'free@test.com', 
 '$2a$10$kNyyLv2e1Zfzkei5Ap8dSeU1MsJIElO2aiZ/sexX6trLcAdCxXLHu', 
 '免费用户小明', 
 'email', 
 'free', 
 'expired', 
 NOW() - INTERVAL '30 days',
 NOW());

-- 用户2: Pro用户（手机登录，会员有效）
-- 密码: test123456
INSERT INTO "users" 
("id", "phone", "password", "nickname", "loginType", "accountType", "subscriptionStatus", "subscriptionExpireAt", "createdAt", "updatedAt")
VALUES 
('22222222-2222-2222-2222-222222222222', 
 '13800138000', 
 '$2a$10$v7thjnHYi1N.8pRsoAE2Me8Nxr44Gfs1N6MXalSGVvjyrdShQNRVe', 
 'Pro会员小红', 
 'phone', 
 'pro', 
 'active', 
 NOW() + INTERVAL '365 days',
 NOW() - INTERVAL '60 days',
 NOW());

-- 用户3: Pro用户（邮箱登录，会员即将到期）
-- 密码: test123456
INSERT INTO "users" 
("id", "email", "password", "nickname", "loginType", "accountType", "subscriptionStatus", "subscriptionExpireAt", "createdAt", "updatedAt")
VALUES 
('33333333-3333-3333-3333-333333333333', 
 'pro@test.com', 
 '$2a$10$VAUTMk5eyL5iFu0OQ5qyTuglIKigYHiDBlSOPd.XXPPQyOCZwKa9.', 
 'Pro会员小李', 
 'email', 
 'pro', 
 'active', 
 NOW() + INTERVAL '5 days',
 NOW() - INTERVAL '85 days',
 NOW());

-- 用户4: 已过期的Pro用户
-- 密码: test123456
INSERT INTO "users" 
("id", "email", "password", "nickname", "loginType", "accountType", "subscriptionStatus", "subscriptionExpireAt", "createdAt", "updatedAt")
VALUES 
('44444444-4444-4444-4444-444444444444', 
 'expired@test.com', 
 '$2a$10$/BsJy9tg6CW/wi7cVQsFqOW7kjisHRnvKhZmb1jPllphaG0dFt6jm', 
 '过期会员小王', 
 'email', 
 'pro', 
 'expired', 
 NOW() - INTERVAL '10 days',
 NOW() - INTERVAL '100 days',
 NOW());

-- 用户5: 微信登录用户
INSERT INTO "users" 
("id", "wechatOpenId", "nickname", "avatar", "loginType", "accountType", "subscriptionStatus", "createdAt", "updatedAt")
VALUES 
('55555555-5555-5555-5555-555555555555', 
 'wx_test_openid_12345', 
 '微信用户张三', 
 'https://avatars.githubusercontent.com/u/1?v=4', 
 'wechat', 
 'free', 
 'expired', 
 NOW() - INTERVAL '15 days',
 NOW());

-- ============================================
-- 2. 插入待办事项
-- ============================================

-- 用户1的待办事项（免费用户 - 少量数据）
INSERT INTO "todos" 
("id", "title", "description", "importance", "urgency", "status", "dueDate", "userId", "createdAt", "updatedAt")
VALUES 
('10000000-0000-0000-0000-000000000001', '学习Vue3基础', '完成Vue3官方教程前5章', 'A', 1, 'in_progress', NOW() + INTERVAL '3 days', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '2 days', NOW()),
('10000000-0000-0000-0000-000000000002', '购买日用品', '牙膏、洗发水、纸巾', 'C', 3, 'pending', NOW() + INTERVAL '7 days', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '1 day', NOW()),
('10000000-0000-0000-0000-000000000003', '健身房锻炼', '每周至少3次有氧运动', 'B', 2, 'pending', NOW() + INTERVAL '2 days', '11111111-1111-1111-1111-111111111111', NOW(), NOW()),
('10000000-0000-0000-0000-000000000004', '完成项目报告', '整理Q4季度项目总结报告', 'A', 1, 'completed', NOW() - INTERVAL '5 days', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '10 days', NOW() - INTERVAL '5 days');

-- 用户2的待办事项（Pro用户 - 较多数据，展示Pro功能）
INSERT INTO "todos" 
("id", "title", "description", "importance", "urgency", "status", "dueDate", "userId", "createdAt", "updatedAt")
VALUES 
-- 重要紧急
('20000000-0000-0000-0000-000000000001', '紧急修复生产环境Bug', '用户登录失败问题，影响大量用户', 'A', 1, 'in_progress', NOW() + INTERVAL '6 hours', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '2 hours', NOW()),
('20000000-0000-0000-0000-000000000002', '准备明天的产品演示', '完成PPT和Demo环境搭建', 'A', 1, 'in_progress', NOW() + INTERVAL '1 day', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '1 day', NOW()),
-- 重要不紧急
('20000000-0000-0000-0000-000000000003', '学习NestJS高级特性', '微服务、GraphQL、WebSocket等', 'A', 3, 'pending', NOW() + INTERVAL '30 days', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '5 days', NOW()),
('20000000-0000-0000-0000-000000000004', '代码重构计划', '优化用户模块代码结构', 'A', 4, 'pending', NOW() + INTERVAL '21 days', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '3 days', NOW()),
-- 紧急不重要
('20000000-0000-0000-0000-000000000005', '更新个人简历', '添加最新项目经验', 'B', 2, 'pending', NOW() + INTERVAL '5 days', '22222222-2222-2222-2222-222222222222', NOW(), NOW()),
('20000000-0000-0000-0000-000000000006', '参加技术分享会', '主题：前端性能优化实践', 'B', 1, 'completed', NOW() - INTERVAL '2 days', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '7 days', NOW() - INTERVAL '2 days'),
-- 不重要不紧急
('20000000-0000-0000-0000-000000000007', '整理电脑文件', '删除无用文件，整理文档', 'C', 4, 'pending', NOW() + INTERVAL '14 days', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '1 day', NOW()),
('20000000-0000-0000-0000-000000000008', '观看技术视频', 'B站收藏的编程教程', 'D', 5, 'pending', NULL, '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '10 days', NOW()),
-- 已完成的任务
('20000000-0000-0000-0000-000000000009', '完成数据库设计', '设计用户、订单、待办表结构', 'A', 1, 'completed', NOW() - INTERVAL '15 days', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '20 days', NOW() - INTERVAL '15 days'),
('20000000-0000-0000-0000-000000000010', '实现支付功能', '集成支付宝和微信支付', 'A', 2, 'completed', NOW() - INTERVAL '7 days', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '14 days', NOW() - INTERVAL '7 days'),
('20000000-0000-0000-0000-000000000011', '编写API文档', '完善接口说明和示例', 'B', 3, 'completed', NOW() - INTERVAL '10 days', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '15 days', NOW() - INTERVAL '10 days'),
-- 已取消的任务
('20000000-0000-0000-0000-000000000012', '学习PHP框架', '改用NestJS后不再需要', 'C', 4, 'cancelled', NULL, '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '30 days', NOW() - INTERVAL '25 days');

-- 用户3的待办事项（Pro用户 - 中等数据）
INSERT INTO "todos" 
("id", "title", "description", "importance", "urgency", "status", "dueDate", "userId", "createdAt", "updatedAt")
VALUES 
('30000000-0000-0000-0000-000000000001', '准备年度总结报告', '整理全年工作成果', 'A', 1, 'in_progress', NOW() + INTERVAL '10 days', '33333333-3333-3333-3333-333333333333', NOW() - INTERVAL '3 days', NOW()),
('30000000-0000-0000-0000-000000000002', '续费Pro会员', '5天后到期，记得续费', 'A', 1, 'pending', NOW() + INTERVAL '5 days', '33333333-3333-3333-3333-333333333333', NOW(), NOW()),
('30000000-0000-0000-0000-000000000003', '学习AI大模型应用', '研究ChatGPT API集成方案', 'B', 2, 'in_progress', NOW() + INTERVAL '20 days', '33333333-3333-3333-3333-333333333333', NOW() - INTERVAL '5 days', NOW()),
('30000000-0000-0000-0000-000000000004', '优化AI分析功能', '使用智谱GLM-4.7优化提示词', 'A', 2, 'completed', NOW() - INTERVAL '3 days', '33333333-3333-3333-3333-333333333333', NOW() - INTERVAL '7 days', NOW() - INTERVAL '3 days'),
('30000000-0000-0000-0000-000000000005', '团队协作工具调研', '对比Notion、飞书、企业微信', 'C', 3, 'pending', NOW() + INTERVAL '15 days', '33333333-3333-3333-3333-333333333333', NOW() - INTERVAL '2 days', NOW());

-- 用户4的待办事项（过期Pro用户）
INSERT INTO "todos" 
("id", "title", "description", "importance", "urgency", "status", "userId", "createdAt", "updatedAt")
VALUES 
('40000000-0000-0000-0000-000000000001', '考虑重新订阅Pro', '评估Pro功能的价值', 'B', 2, 'pending', '44444444-4444-4444-4444-444444444444', NOW() - INTERVAL '1 day', NOW()),
('40000000-0000-0000-0000-000000000002', '导出历史数据', '备份所有待办事项数据', 'A', 1, 'completed', '44444444-4444-4444-4444-444444444444', NOW() - INTERVAL '5 days', NOW() - INTERVAL '2 days');

-- 用户5的待办事项（微信用户）
INSERT INTO "todos" 
("id", "title", "description", "importance", "urgency", "status", "userId", "createdAt", "updatedAt")
VALUES 
('50000000-0000-0000-0000-000000000001', '体验Pro功能', '查看AI分析是否值得订阅', 'C', 3, 'pending', '55555555-5555-5555-5555-555555555555', NOW(), NOW()),
('50000000-0000-0000-0000-000000000002', '添加第一个待办', '测试基础功能', 'B', 2, 'completed', '55555555-5555-5555-5555-555555555555', NOW() - INTERVAL '1 day', NOW());

-- ============================================
-- 3. 插入订单数据
-- ============================================

-- 用户2的订单（Pro用户，已支付的年度订阅）
INSERT INTO "orders" 
("id", "orderNo", "userId", "planType", "amount", "paymentMethod", "status", "tradeNo", "paidAt", "createdAt", "updatedAt")
VALUES 
('a0000000-0000-0000-0000-000000000001', 'ORD202601010001', '22222222-2222-2222-2222-222222222222', 'yearly', 14990, 'alipay', 'paid', 'ALIPAY2026010112345678', NOW() - INTERVAL '60 days', NOW() - INTERVAL '60 days', NOW() - INTERVAL '60 days');

-- 用户3的订单（Pro用户，已支付的季度订阅）
INSERT INTO "orders" 
("id", "orderNo", "userId", "planType", "amount", "paymentMethod", "status", "tradeNo", "paidAt", "createdAt", "updatedAt")
VALUES 
('a0000000-0000-0000-0000-000000000002', 'ORD202510150001', '33333333-3333-3333-3333-333333333333', 'quarterly', 4990, 'wechat', 'paid', 'WX20251015987654321', NOW() - INTERVAL '85 days', NOW() - INTERVAL '85 days', NOW() - INTERVAL '85 days');

-- 用户4的订单（过期用户，之前的订阅）
INSERT INTO "orders" 
("id", "orderNo", "userId", "planType", "amount", "paymentMethod", "status", "tradeNo", "paidAt", "createdAt", "updatedAt")
VALUES 
('a0000000-0000-0000-0000-000000000003', 'ORD202509010001', '44444444-4444-4444-4444-444444444444', 'monthly', 1990, 'alipay', 'paid', 'ALIPAY2025090111223344', NOW() - INTERVAL '100 days', NOW() - INTERVAL '100 days', NOW() - INTERVAL '100 days');

-- 用户1的订单（免费用户，尝试支付但取消）
INSERT INTO "orders" 
("id", "orderNo", "userId", "planType", "amount", "paymentMethod", "status", "createdAt", "updatedAt")
VALUES 
('a0000000-0000-0000-0000-000000000004', 'ORD202601030001', '11111111-1111-1111-1111-111111111111', 'monthly', 1990, 'alipay', 'cancelled', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days');

-- 用户5的订单（待支付）
INSERT INTO "orders" 
("id", "orderNo", "userId", "planType", "amount", "paymentMethod", "status", "payUrl", "createdAt", "updatedAt")
VALUES 
('a0000000-0000-0000-0000-000000000005', 'ORD202601040001', '55555555-5555-5555-5555-555555555555', 'monthly', 1990, 'wechat', 'pending', '/api/payment/mock-pay?orderNo=ORD202601040001', NOW() - INTERVAL '30 minutes', NOW());

-- ============================================
-- 4. 统计数据
-- ============================================

-- 显示插入的数据统计
SELECT 
    '用户数' as 类型, 
    COUNT(*) as 数量,
    COUNT(*) FILTER (WHERE "accountType" = 'pro') as "Pro用户",
    COUNT(*) FILTER (WHERE "accountType" = 'free') as "免费用户"
FROM "users"

UNION ALL

SELECT 
    '待办事项数' as 类型, 
    COUNT(*) as 数量,
    COUNT(*) FILTER (WHERE "status" = 'completed') as "已完成",
    COUNT(*) FILTER (WHERE "status" = 'pending') as "待处理"
FROM "todos"

UNION ALL

SELECT 
    '订单数' as 类型, 
    COUNT(*) as 数量,
    COUNT(*) FILTER (WHERE "status" = 'paid') as "已支付",
    COUNT(*) FILTER (WHERE "status" = 'pending') as "待支付"
FROM "orders";

-- ============================================
-- 完成
-- ============================================

SELECT '测试数据导入完成！' as message;

