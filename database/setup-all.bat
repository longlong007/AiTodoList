@echo off
chcp 65001 >nul
REM ============================================
REM TodoList Complete Database Setup
REM One-click setup for all tables and test data
REM ============================================

echo ====================================
echo TodoList Database Setup Tool
echo ====================================
echo.

REM Database configuration
if "%DB_HOST%"=="" set DB_HOST=localhost
if "%DB_PORT%"=="" set DB_PORT=5432
if "%DB_NAME%"=="" set DB_NAME=todolist
if "%DB_USER%"=="" set DB_USER=postgres

echo Database Configuration:
echo   Host: %DB_HOST%
echo   Port: %DB_PORT%
echo   Database: %DB_NAME%
echo   User: %DB_USER%
echo.

REM Check if psql command exists
where psql >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] psql command not found
    echo Please install PostgreSQL client and add it to PATH
    pause
    exit /b 1
)

REM Check if we're in the database directory
if not exist "schema.sql" (
    echo [ERROR] schema.sql not found
    echo Please run this script from the database directory:
    echo   cd database
    echo   setup-all.bat
    pause
    exit /b 1
)

echo This will:
echo   1. Create database structure (schema.sql)
echo   2. Import test data (seed.sql)
echo.
echo [WARNING] This will DROP and recreate all tables!
echo All existing data will be LOST!
echo.
set /p confirm=Continue? (Y/N): 
if /i not "%confirm%"=="Y" (
    echo Cancelled.
    pause
    exit /b 0
)

echo.
echo ====================================
echo Step 1/2: Creating database structure...
echo ====================================
set PGCLIENTENCODING=UTF8
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% --set=client_encoding=UTF8 -f schema.sql

if %errorlevel% neq 0 (
    echo [ERROR] Failed to create database structure
    echo.
    echo Common issues:
    echo   - Database "%DB_NAME%" does not exist
    echo     Solution: psql -U %DB_USER% -c "CREATE DATABASE %DB_NAME%;"
    echo   - Wrong password
    echo     Solution: Check your PostgreSQL password
    echo   - PostgreSQL service not running
    echo     Solution: Start PostgreSQL service
    pause
    exit /b 1
)

echo [SUCCESS] Database structure created
echo.

echo ====================================
echo Step 2/2: Importing test data...
echo ====================================
set PGCLIENTENCODING=UTF8
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% --set=client_encoding=UTF8 -f seed.sql

if %errorlevel% neq 0 (
    echo [ERROR] Failed to import test data
    pause
    exit /b 1
)

echo [SUCCESS] Test data imported
echo.

echo ====================================
echo Setup completed successfully!
echo ====================================
echo.
echo Database structure includes:
echo   - users table (with OAuth support)
echo   - todos table
echo   - orders table
echo   - reports table (with PDF storage fields)
echo.
echo Test accounts (password: test123456):
echo.
echo   1. Free User
echo      Email: free@test.com
echo.
echo   2. Pro User (1 year subscription)
echo      Phone: 13800138000
echo.
echo   3. Pro User (expiring soon)
echo      Email: pro@test.com
echo.
echo   4. Expired Pro User
echo      Email: expired@test.com
echo.
echo   5. Chinese Test User (Pro, 100 todos)
echo      Email: chinese@test.com
echo.
echo Backend setup:
echo   1. Configure backend/.env
echo   2. Run: cd backend
echo   3. Run: npm install
echo   4. Run: npm run start:dev
echo.
echo Frontend setup:
echo   1. Configure frontend/.env
echo   2. Run: cd frontend
echo   3. Run: npm install
echo   4. Run: npm run dev
echo.

pause
