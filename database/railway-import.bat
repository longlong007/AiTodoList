@echo off
chcp 65001 >nul
REM ============================================
REM Railway Database Import Tool
REM 用于将schema.sql和seed.sql导入Railway数据库
REM ============================================

echo ====================================
echo Railway Database Import Tool
echo ====================================
echo.

REM ============================================
REM 配置区域 - 请修改为你的Railway数据库连接信息
REM ============================================
REM 从 Railway 项目的 PostgreSQL 服务页面获取这些信息

REM 方式一：使用单独的连接参数
set RAILWAY_DB_HOST=crossover.proxy.rlwy.net
set RAILWAY_DB_PORT=34153
set RAILWAY_DB_USER=postgres
set RAILWAY_DB_NAME=railway
set RAILWAY_DB_PASSWORD=bDevxOCwymBozJDmWEXIktaeKbGWZOVl

REM 方式二：使用 DATABASE_URL（取消注释下面一行）
REM set DATABASE_URL=postgresql://postgres:password@host:port/railway

REM ============================================
REM 检查 psql 命令
REM ============================================
where psql >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] psql 命令未找到
    echo 请安装 PostgreSQL 客户端并添加到 PATH
    echo 下载地址: https://www.postgresql.org/download/windows/
    pause
    exit /b 1
)

REM ============================================
REM 检查 SQL 文件
REM ============================================
if not exist "schema.sql" (
    echo [ERROR] schema.sql 文件未找到
    echo 请在 database 目录下运行此脚本
    pause
    exit /b 1
)

if not exist "seed.sql" (
    echo [ERROR] seed.sql 文件未找到
    pause
    exit /b 1
)

REM ============================================
REM 显示连接信息
REM ============================================
echo 数据库连接信息:
if defined DATABASE_URL (
    echo   DATABASE_URL: %DATABASE_URL%
) else (
    echo   Host: %RAILWAY_DB_HOST%
    echo   Port: %RAILWAY_DB_PORT%
    echo   User: %RAILWAY_DB_USER%
    echo   Database: %RAILWAY_DB_NAME%
    echo   Password: ********
)
echo.

REM ============================================
REM 确认提示
REM ============================================
echo [警告] 此操作将:
echo   1. 删除所有现有表 (DROP TABLE)
echo   2. 重新创建数据库结构
echo   3. 导入测试数据
echo.
echo [重要] 所有现有数据将会丢失!
echo.
set /p confirm=确认继续导入? (Y/N): 
if /i not "%confirm%"=="Y" (
    echo 操作已取消.
    pause
    exit /b 0
)

REM ============================================
REM 设置环境变量
REM ============================================
set PGCLIENTENCODING=UTF8
set PGOPTIONS=--lc-messages=C
if not defined DATABASE_URL (
    set PGPASSWORD=%RAILWAY_DB_PASSWORD%
)

echo.
echo ====================================
echo 步骤 1/2: 导入数据库结构 (schema.sql)
echo ====================================
echo.

REM 执行 schema.sql
if defined DATABASE_URL (
    psql %DATABASE_URL% --set=client_encoding=UTF8 -f schema.sql
) else (
    psql -h %RAILWAY_DB_HOST% -p %RAILWAY_DB_PORT% -U %RAILWAY_DB_USER% -d %RAILWAY_DB_NAME% --set=client_encoding=UTF8 -f schema.sql
)

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] 数据库结构导入失败
    echo.
    echo 常见问题:
    echo   - 连接信息不正确
    echo   - 密码错误
    echo   - 网络连接问题
    echo   - Railway 数据库服务未运行
    echo.
    echo 解决方案:
    echo   1. 检查 Railway 项目中的数据库连接信息
    echo   2. 确认数据库服务状态正常
    echo   3. 或使用 Railway CLI: railway run psql -f schema.sql
    pause
    exit /b 1
)

echo.
echo [SUCCESS] 数据库结构导入成功
echo.

echo ====================================
echo 步骤 2/2: 导入测试数据 (seed.sql)
echo ====================================
echo.

REM 执行 seed.sql
if defined DATABASE_URL (
    psql %DATABASE_URL% --set=client_encoding=UTF8 -f seed.sql
) else (
    psql -h %RAILWAY_DB_HOST% -p %RAILWAY_DB_PORT% -U %RAILWAY_DB_USER% -d %RAILWAY_DB_NAME% --set=client_encoding=UTF8 -f seed.sql
)

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] 测试数据导入失败
    pause
    exit /b 1
)

echo.
echo [SUCCESS] 测试数据导入成功
echo.

REM ============================================
REM 导入完成提示
REM ============================================
echo ====================================
echo 导入完成!
echo ====================================
echo.
echo 已成功导入:
echo   ✓ 数据库结构 (users, todos, orders, reports 表)
echo   ✓ 5 个测试用户账号
echo   ✓ 约 25 条待办事项
echo   ✓ 5 条订单记录
echo.
echo 测试账号 (密码: test123456):
echo   1. free@test.com      - 免费用户
echo   2. 13800138000        - Pro用户(手机登录)
echo   3. pro@test.com       - Pro用户(即将到期)
echo   4. expired@test.com   - 已过期Pro用户
echo   5. 微信用户(wx_test_openid_12345)
echo.
echo 下一步:
echo   1. 更新 backend/.env 中的数据库连接信息
echo   2. 启动后端服务: cd backend && npm run start:dev
echo   3. 访问前端应用并使用测试账号登录
echo.

pause
