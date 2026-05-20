#!/bin/sh
set -e

echo "Waiting for PostgreSQL at ${DB_HOST:-postgres}:${DB_PORT:-5432}..."
until python -c "
import psycopg2, os, sys
try:
    psycopg2.connect(
        dbname=os.environ.get('DB_NAME', 'deep_vision'),
        user=os.environ.get('DB_USER', 'deepvision_user'),
        password=os.environ.get('DB_PASSWORD', ''),
        host=os.environ.get('DB_HOST', 'postgres'),
        port=os.environ.get('DB_PORT', '5432'),
    )
    sys.exit(0)
except Exception:
    sys.exit(1)
" 2>/dev/null; do
    echo "  PostgreSQL not ready — retrying in 2s..."
    sleep 2
done
echo "PostgreSQL is ready."

exec "$@"
