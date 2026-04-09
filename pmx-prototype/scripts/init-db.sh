#!/bin/bash
# PMX Database Initialization Script
# Runs all schema files and seed data in order

set -e

DB_HOST=${DB_HOST:-pmx-db}
DB_PORT=${DB_PORT:-5432}
DB_USER=${DB_USER:-pmx_user}
DB_NAME=${DB_NAME:-pmx_production}

echo "Waiting for PostgreSQL to be ready..."
until PGPASSWORD=$POSTGRES_PASSWORD pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME; do
  sleep 2
done

echo "Running PMX database initialization..."

PGPASSWORD=$POSTGRES_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f /app/scripts/schema.sql
echo "1/6 Core schema done"

PGPASSWORD=$POSTGRES_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f /app/scripts/seed.sql
echo "2/6 Base seed done"

PGPASSWORD=$POSTGRES_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f /app/scripts/seed-demo.sql
echo "3/6 Demo data done"

PGPASSWORD=$POSTGRES_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f /app/scripts/schema-cms.sql
echo "4/6 CMS schema done"

PGPASSWORD=$POSTGRES_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f /app/scripts/schema-qc-templates.sql
echo "5/6 QC templates done"

PGPASSWORD=$POSTGRES_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f /app/scripts/schema-drug-dictionary.sql
echo "6/6 Drug dictionary done"

echo "PMX database initialization complete!"
