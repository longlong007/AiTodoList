#!/bin/bash

# ============================================
# TodoList Complete Database Setup
# One-click setup for all tables and test data
# ============================================

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Database configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-todolist}"
DB_USER="${DB_USER:-postgres}"

echo -e "${GREEN}====================================${NC}"
echo -e "${GREEN}TodoList Database Setup Tool${NC}"
echo -e "${GREEN}====================================${NC}"
echo ""
echo -e "Database Configuration:"
echo -e "  Host: ${YELLOW}$DB_HOST${NC}"
echo -e "  Port: ${YELLOW}$DB_PORT${NC}"
echo -e "  Database: ${YELLOW}$DB_NAME${NC}"
echo -e "  User: ${YELLOW}$DB_USER${NC}"
echo ""

# Check if psql command exists
if ! command -v psql &> /dev/null; then
    echo -e "${RED}[ERROR] psql command not found${NC}"
    echo "Please install PostgreSQL client tools"
    exit 1
fi

# Check if we're in the database directory
if [ ! -f "schema.sql" ]; then
    echo -e "${RED}[ERROR] schema.sql not found${NC}"
    echo "Please run this script from the database directory:"
    echo "  cd database"
    echo "  ./setup-all.sh"
    exit 1
fi

echo "This will:"
echo "  1. Create database structure (schema.sql)"
echo "  2. Import test data (seed.sql)"
echo ""
echo -e "${RED}[WARNING] This will DROP and recreate all tables!${NC}"
echo -e "${RED}All existing data will be LOST!${NC}"
echo ""
read -p "Continue? (Y/N): " confirm

if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

echo ""
echo -e "${BLUE}====================================${NC}"
echo -e "${BLUE}Step 1/2: Creating database structure...${NC}"
echo -e "${BLUE}====================================${NC}"

PGCLIENTENCODING=UTF8 psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f schema.sql

if [ $? -ne 0 ]; then
    echo -e "${RED}[ERROR] Failed to create database structure${NC}"
    echo ""
    echo "Common issues:"
    echo "  - Database '$DB_NAME' does not exist"
    echo "    Solution: psql -U $DB_USER -c \"CREATE DATABASE $DB_NAME;\""
    echo "  - Wrong password"
    echo "    Solution: Set PGPASSWORD environment variable"
    echo "  - PostgreSQL service not running"
    echo "    Solution: sudo systemctl start postgresql"
    exit 1
fi

echo -e "${GREEN}[SUCCESS] Database structure created${NC}"
echo ""

echo -e "${BLUE}====================================${NC}"
echo -e "${BLUE}Step 2/2: Importing test data...${NC}"
echo -e "${BLUE}====================================${NC}"

PGCLIENTENCODING=UTF8 psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f seed.sql

if [ $? -ne 0 ]; then
    echo -e "${RED}[ERROR] Failed to import test data${NC}"
    exit 1
fi

echo -e "${GREEN}[SUCCESS] Test data imported${NC}"
echo ""

echo -e "${GREEN}====================================${NC}"
echo -e "${GREEN}Setup completed successfully!${NC}"
echo -e "${GREEN}====================================${NC}"
echo ""
echo "Database structure includes:"
echo "  - users table (with OAuth support)"
echo "  - todos table"
echo "  - orders table"
echo "  - reports table (with PDF storage fields)"
echo ""
echo "Test accounts (password: test123456):"
echo ""
echo "  1. Free User"
echo "     Email: free@test.com"
echo ""
echo "  2. Pro User (1 year subscription)"
echo "     Phone: 13800138000"
echo ""
echo "  3. Pro User (expiring soon)"
echo "     Email: pro@test.com"
echo ""
echo "  4. Expired Pro User"
echo "     Email: expired@test.com"
echo ""
echo "  5. Chinese Test User (Pro, 100 todos)"
echo "     Email: chinese@test.com"
echo ""
echo "Backend setup:"
echo "  1. Configure backend/.env"
echo "  2. Run: cd backend"
echo "  3. Run: npm install"
echo "  4. Run: npm run start:dev"
echo ""
echo "Frontend setup:"
echo "  1. Configure frontend/.env"
echo "  2. Run: cd frontend"
echo "  3. Run: npm install"
echo "  4. Run: npm run dev"
echo ""
