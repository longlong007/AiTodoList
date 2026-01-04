#!/bin/bash

# ============================================
# 数据库导入脚本 (Linux/Mac)
# ============================================

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 数据库配置（从环境变量读取，或使用默认值）
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-todolist}"
DB_USER="${DB_USER:-postgres}"

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}TodoList 数据库导入工具${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo -e "数据库配置:"
echo -e "  主机: ${YELLOW}$DB_HOST${NC}"
echo -e "  端口: ${YELLOW}$DB_PORT${NC}"
echo -e "  数据库: ${YELLOW}$DB_NAME${NC}"
echo -e "  用户: ${YELLOW}$DB_USER${NC}"
echo ""

# 检查 psql 命令是否存在
if ! command -v psql &> /dev/null; then
    echo -e "${RED}错误: 未找到 psql 命令${NC}"
    echo "请先安装 PostgreSQL 客户端工具"
    exit 1
fi

# 选择导入类型
echo "请选择操作:"
echo "  1) 仅创建表结构 (schema.sql)"
echo "  2) 仅导入测试数据 (seed.sql)"
echo "  3) 完整导入 (先创建表，再导入数据)"
echo "  4) 退出"
echo ""
read -p "请输入选项 (1-4): " choice

case $choice in
  1)
    echo -e "${YELLOW}正在创建表结构...${NC}"
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f database/schema.sql
    ;;
  2)
    echo -e "${YELLOW}正在导入测试数据...${NC}"
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f database/seed.sql
    ;;
  3)
    echo -e "${YELLOW}正在创建表结构...${NC}"
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f database/schema.sql
    
    if [ $? -eq 0 ]; then
      echo -e "${GREEN}表结构创建成功${NC}"
      echo -e "${YELLOW}正在导入测试数据...${NC}"
      PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f database/seed.sql
    else
      echo -e "${RED}表结构创建失败${NC}"
      exit 1
    fi
    ;;
  4)
    echo "已取消"
    exit 0
    ;;
  *)
    echo -e "${RED}无效的选项${NC}"
    exit 1
    ;;
esac

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}================================${NC}"
    echo -e "${GREEN}导入完成！${NC}"
    echo -e "${GREEN}================================${NC}"
    echo ""
    echo "测试账号信息:"
    echo "  1. 免费用户"
    echo "     邮箱: free@test.com"
    echo "     密码: test123456"
    echo ""
    echo "  2. Pro用户 (会员有效期1年)"
    echo "     手机: 13800138000"
    echo "     密码: test123456"
    echo ""
    echo "  3. Pro用户 (会员即将到期)"
    echo "     邮箱: pro@test.com"
    echo "     密码: test123456"
    echo ""
    echo "  4. 过期Pro用户"
    echo "     邮箱: expired@test.com"
    echo "     密码: test123456"
else
    echo -e "${RED}导入失败${NC}"
    exit 1
fi

