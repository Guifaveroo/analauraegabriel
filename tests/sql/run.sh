#!/usr/bin/env bash
# Recria um banco local, aplica as migrações e roda os testes SQL.
# Requer PostgreSQL 16 local com acesso via psql. Uso: npm run test:sql
set -euo pipefail
cd "$(dirname "$0")/../.."
DB=wedtest
psql -X -q -c "drop database if exists $DB" -c "create database $DB" >/dev/null 2>&1
for f in tests/sql/supabase-shim.sql supabase/migrations/*.sql; do
  psql -X -q -v ON_ERROR_STOP=1 -d $DB -f "$f" >/dev/null 2>&1 || { echo "erro em $f"; psql -X -v ON_ERROR_STOP=1 -d $DB -f "$f" 2>&1 | grep -i error; exit 1; }
done
psql -X -q -v ON_ERROR_STOP=1 -d $DB -f tests/sql/rules.sql
tests/sql/concurrency.sh $DB
