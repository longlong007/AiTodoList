@echo off
REM 添加 PDF 存储相关字段到 reports 表
REM Windows 批处理脚本

echo ====================================
echo 数据库迁移：添加 PDF 存储字段
echo ====================================
echo.

REM 检查 psql 是否可用
where psql >nul 2>nul
if %errorlevel% neq 0 (
    echo 错误：未找到 psql 命令
    echo 请安装 PostgreSQL 客户端或将其添加到 PATH
    pause
    exit /b 1
)

echo 正在连接数据库...
echo.

REM 执行迁移脚本
psql -U postgres -d todolist -f add-report-pdf-fields.sql

if %errorlevel% equ 0 (
    echo.
    echo ====================================
    echo ✅ 迁移成功完成！
    echo ====================================
) else (
    echo.
    echo ====================================
    echo ❌ 迁移失败，请查看错误信息
    echo ====================================
)

echo.
pause

