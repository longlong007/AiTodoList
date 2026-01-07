@echo off
chcp 65001 >nul
REM Add PDF storage fields to reports table
REM Windows Batch Script

echo ====================================
echo Database Migration: Add PDF Storage Fields
echo ====================================
echo.

REM Check if psql is available
where psql >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: psql command not found
    echo Please install PostgreSQL client or add it to PATH
    pause
    exit /b 1
)

echo Connecting to database...
echo.
echo NOTE: If reports table does not exist, please run schema.sql first:
echo   psql -U postgres -d todolist -f schema.sql
echo.

REM Execute migration script
psql -U postgres -d todolist -f add-report-pdf-fields.sql

if %errorlevel% equ 0 (
    echo.
    echo ====================================
    echo SUCCESS: Migration completed!
    echo ====================================
) else (
    echo.
    echo ====================================
    echo ERROR: Migration failed
    echo ====================================
    echo.
    echo If you see "relation reports does not exist", run schema.sql first:
    echo   psql -U postgres -d todolist -f schema.sql
)

echo.
pause

