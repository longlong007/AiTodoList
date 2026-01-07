#!/bin/bash
# Add PDF storage fields to reports table
# Linux/macOS Shell Script

echo "===================================="
echo "Database Migration: Add PDF Storage Fields"
echo "===================================="
echo

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "ERROR: psql command not found"
    echo "Please install PostgreSQL client"
    exit 1
fi

echo "Connecting to database..."
echo
echo "NOTE: If reports table does not exist, please run schema.sql first:"
echo "  psql -U postgres -d todolist -f schema.sql"
echo

# Execute migration script
psql -U postgres -d todolist -f add-report-pdf-fields.sql

if [ $? -eq 0 ]; then
    echo
    echo "===================================="
    echo "SUCCESS: Migration completed!"
    echo "===================================="
else
    echo
    echo "===================================="
    echo "ERROR: Migration failed"
    echo "===================================="
    echo
    echo "If you see 'relation reports does not exist', run schema.sql first:"
    echo "  psql -U postgres -d todolist -f schema.sql"
    exit 1
fi

