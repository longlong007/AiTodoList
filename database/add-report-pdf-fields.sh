#!/bin/bash
# 添加 PDF 存储相关字段到 reports 表
# Linux/macOS Shell 脚本

echo "===================================="
echo "数据库迁移：添加 PDF 存储字段"
echo "===================================="
echo

# 检查 psql 是否可用
if ! command -v psql &> /dev/null; then
    echo "错误：未找到 psql 命令"
    echo "请安装 PostgreSQL 客户端"
    exit 1
fi

echo "正在连接数据库..."
echo

# 执行迁移脚本
psql -U postgres -d todolist -f add-report-pdf-fields.sql

if [ $? -eq 0 ]; then
    echo
    echo "===================================="
    echo "✅ 迁移成功完成！"
    echo "===================================="
else
    echo
    echo "===================================="
    echo "❌ 迁移失败，请查看错误信息"
    echo "===================================="
    exit 1
fi

