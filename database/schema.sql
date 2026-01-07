-- ============================================
-- TodoList 数据库表结构
-- ============================================

-- 创建数据库（如果需要）
-- CREATE DATABASE todolist;

-- 删除已存在的表（谨慎使用）
DROP TABLE IF EXISTS "reports" CASCADE;
DROP TABLE IF EXISTS "orders" CASCADE;
DROP TABLE IF EXISTS "todos" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;

-- 删除已存在的枚举类型
DROP TYPE IF EXISTS "users_logintype_enum" CASCADE;
DROP TYPE IF EXISTS "users_accounttype_enum" CASCADE;
DROP TYPE IF EXISTS "users_subscriptionstatus_enum" CASCADE;
DROP TYPE IF EXISTS "todos_importance_enum" CASCADE;
DROP TYPE IF EXISTS "todos_status_enum" CASCADE;
DROP TYPE IF EXISTS "orders_paymentmethod_enum" CASCADE;
DROP TYPE IF EXISTS "orders_status_enum" CASCADE;
DROP TYPE IF EXISTS "orders_plantype_enum" CASCADE;

-- ============================================
-- 创建枚举类型
-- ============================================

-- 用户登录类型
CREATE TYPE "users_logintype_enum" AS ENUM ('phone', 'email', 'wechat', 'google', 'github');

-- 账户类型
CREATE TYPE "users_accounttype_enum" AS ENUM ('free', 'pro');

-- 订阅状态
CREATE TYPE "users_subscriptionstatus_enum" AS ENUM ('active', 'expired', 'cancelled');

-- Todo重要性
CREATE TYPE "todos_importance_enum" AS ENUM ('A', 'B', 'C', 'D');

-- Todo状态
CREATE TYPE "todos_status_enum" AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');

-- 支付方式
CREATE TYPE "orders_paymentmethod_enum" AS ENUM ('alipay', 'wechat');

-- 订单状态
CREATE TYPE "orders_status_enum" AS ENUM ('pending', 'paid', 'failed', 'refunded', 'cancelled');

-- 套餐类型
CREATE TYPE "orders_plantype_enum" AS ENUM ('monthly', 'quarterly', 'yearly');

-- ============================================
-- 用户表
-- ============================================

CREATE TABLE "users" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "phone" VARCHAR UNIQUE,
    "email" VARCHAR UNIQUE,
    "wechatOpenId" VARCHAR UNIQUE,
    "googleId" VARCHAR UNIQUE,
    "githubId" VARCHAR UNIQUE,
    "password" VARCHAR,
    "nickname" VARCHAR,
    "avatar" VARCHAR,
    "loginType" "users_logintype_enum" NOT NULL DEFAULT 'email',
    "accountType" "users_accounttype_enum" NOT NULL DEFAULT 'free',
    "subscriptionStatus" "users_subscriptionstatus_enum" NOT NULL DEFAULT 'expired',
    "subscriptionExpireAt" TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 创建索引
CREATE INDEX "IDX_users_phone" ON "users" ("phone");
CREATE INDEX "IDX_users_email" ON "users" ("email");
CREATE INDEX "IDX_users_wechatOpenId" ON "users" ("wechatOpenId");
CREATE INDEX "IDX_users_googleId" ON "users" ("googleId");
CREATE INDEX "IDX_users_githubId" ON "users" ("githubId");
CREATE INDEX "IDX_users_accountType" ON "users" ("accountType");

-- ============================================
-- 待办事项表
-- ============================================

CREATE TABLE "todos" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "title" VARCHAR NOT NULL,
    "description" TEXT,
    "importance" "todos_importance_enum" NOT NULL DEFAULT 'C',
    "urgency" INTEGER NOT NULL DEFAULT 3,
    "status" "todos_status_enum" NOT NULL DEFAULT 'pending',
    "dueDate" TIMESTAMP,
    "completedAt" TIMESTAMP,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT "FK_todos_userId" FOREIGN KEY ("userId") 
        REFERENCES "users"("id") ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX "IDX_todos_userId" ON "todos" ("userId");
CREATE INDEX "IDX_todos_status" ON "todos" ("status");
CREATE INDEX "IDX_todos_importance" ON "todos" ("importance");
CREATE INDEX "IDX_todos_urgency" ON "todos" ("urgency");
CREATE INDEX "IDX_todos_dueDate" ON "todos" ("dueDate");

-- ============================================
-- 订单表
-- ============================================

CREATE TABLE "orders" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "orderNo" VARCHAR UNIQUE NOT NULL,
    "userId" UUID NOT NULL,
    "planType" "orders_plantype_enum" NOT NULL,
    "amount" INTEGER NOT NULL,
    "paymentMethod" "orders_paymentmethod_enum" NOT NULL,
    "status" "orders_status_enum" NOT NULL DEFAULT 'pending',
    "tradeNo" VARCHAR,
    "paidAt" TIMESTAMP,
    "payUrl" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT "FK_orders_userId" FOREIGN KEY ("userId") 
        REFERENCES "users"("id") ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX "IDX_orders_orderNo" ON "orders" ("orderNo");
CREATE INDEX "IDX_orders_userId" ON "orders" ("userId");
CREATE INDEX "IDX_orders_status" ON "orders" ("status");

-- ============================================
-- AI分析报告表
-- ============================================

CREATE TABLE "reports" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "title" VARCHAR NOT NULL,
    "content" TEXT NOT NULL,
    "statisticsData" TEXT,
    "pdfUrl" VARCHAR,
    "pdfKey" VARCHAR,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT "FK_reports_userId" FOREIGN KEY ("userId") 
        REFERENCES "users"("id") ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX "IDX_reports_userId" ON "reports" ("userId");
CREATE INDEX "IDX_reports_createdAt" ON "reports" ("createdAt");

-- ============================================
-- 触发器：自动更新 updatedAt
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON "users"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_todos_updated_at BEFORE UPDATE ON "todos"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON "orders"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON "reports"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 完成
-- ============================================

-- 显示表结构
\dt

