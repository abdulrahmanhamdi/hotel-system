#!/bin/sh
# init-db.sh - Optional custom DB initializer

set -e

echo "Running initial database migration scripts..."

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
EOSQL

echo "Database initialized successfully."
