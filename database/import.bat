@echo off
chcp 65001 > nul
REM ============================================
REM 数据库导入脚本 (Windows)
REM ============================================

echo ================================
echo TodoList 数据库导入工具
echo ================================
echo.

REM 数据库配置（从环境变量读取，或使用默认值）
if "%DB_HOST%"=="" set DB_HOST=localhost
if "%DB_PORT%"=="" set DB_PORT=5432
if "%DB_NAME%"=="" set DB_NAME=todolist
if "%DB_USER%"=="" set DB_USER=postgres

echo 数据库配置:
echo   主机: %DB_HOST%
echo   端口: %DB_PORT%
echo   数据库: %DB_NAME%
echo   用户: %DB_USER%
echo.

REM 检查 psql 命令是否存在
where psql >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未找到 psql 命令
    echo 请先安装 PostgreSQL 并将其添加到 PATH 环境变量
    pause
    exit /b 1
)

REM 选择导入类型
echo 请选择操作:
echo   1) 仅创建表结构 (schema.sql)
echo   2) 仅导入测试数据 (seed.sql)
echo   3) 完整导入 (先创建表，再导入数据)
echo   4) 退出
echo.
set /p choice=请输入选项 (1-4): 

if "%choice%"=="1" goto schema
if "%choice%"=="2" goto seed
if "%choice%"=="3" goto full
if "%choice%"=="4" goto end
echo [错误] 无效的选项
pause
exit /b 1

:schema
echo 正在创建表结构...
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f database\schema.sql
goto success

:seed
echo 正在导入测试数据...
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f database\seed.sql
goto success

:full
echo 正在创建表结构...
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f database\schema.sql
if %errorlevel% neq 0 (
    echo [错误] 表结构创建失败
    pause
    exit /b 1
)
echo 表结构创建成功
echo 正在导入测试数据...
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f database\seed.sql
goto success

:success
if %errorlevel% neq 0 (
    echo [错误] 导入失败
    pause
    exit /b 1
)
echo.
echo ================================
echo 导入完成！
echo ================================
echo.
echo 测试账号信息:
echo   1. 免费用户
echo      邮箱: free@test.com
echo      密码: test123456
echo.
echo   2. Pro用户 (会员有效期1年)
echo      手机: 13800138000
echo      密码: test123456
echo.
echo   3. Pro用户 (会员即将到期)
echo      邮箱: pro@test.com
echo      密码: test123456
echo.
echo   4. 过期Pro用户
echo      邮箱: expired@test.com
echo      密码: test123456
echo.

:end
pause

