#!/bin/bash
set -e

# ── Colors ───────────────────────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RESET='\033[0m'

log() { echo -e "${CYAN}[UMRAH-HUB]${RESET} $1"; }
ok()  { echo -e "${GREEN}[OK]${RESET} $1"; }
warn(){ echo -e "${YELLOW}[WARN]${RESET} $1"; }

log "🚀 Starting Umrah Hub All-in-One Container..."
log "═══════════════════════════════════════════"

# ── 1. Init PostgreSQL data dir ──────────────────────────────
if [ ! -s "$PGDATA/PG_VERSION" ]; then
    log "📦 Initializing PostgreSQL database..."
    su -s /bin/sh postgres -c "initdb -D $PGDATA --auth-host=md5 --auth-local=trust -U postgres --encoding=UTF8 --locale=C"
    ok "PostgreSQL initialized"
fi

# ── 2. Start PostgreSQL temporarily for setup ────────────────
log "🐘 Starting PostgreSQL for initial setup..."
su -s /bin/sh postgres -c "pg_ctl -D $PGDATA -l /tmp/pg_setup.log start -w -o '-k /run/postgresql'"

# ── 3. Create DB user & database if not exists ───────────────
log "👤 Setting up database user and schema..."
su -s /bin/sh postgres -c "psql -h /run/postgresql -c \"
  DO \\\$\\\$ BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${DB_USER}') THEN
      CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';
    END IF;
  END \\\$\\\$;
\""

su -s /bin/sh postgres -c "psql -h /run/postgresql -c \"
  SELECT 'CREATE DATABASE ${DB_NAME} OWNER ${DB_USER}'
  WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${DB_NAME}')
\" | grep -E 'CREATE DATABASE' | psql -h /run/postgresql -v ON_ERROR_STOP=0 || true"

# Grant privileges
su -s /bin/sh postgres -c "psql -h /run/postgresql -c \"GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};\""
su -s /bin/sh postgres -c "psql -h /run/postgresql -d ${DB_NAME} -c \"GRANT ALL ON SCHEMA public TO ${DB_USER};\""

ok "Database user '${DB_USER}' and database '${DB_NAME}' ready"

# ── 4. Run SQL migrations ────────────────────────────────────
MIGRATION_DIR="/app/api/migrations/sql"
MARKER_FILE="$PGDATA/.migrations_done"

if [ -d "$MIGRATION_DIR" ] && [ ! -f "$MARKER_FILE" ]; then
    log "🗄️  Running database migrations..."
    for sql_file in $(ls "$MIGRATION_DIR"/*.sql 2>/dev/null | sort); do
        filename=$(basename "$sql_file")
        log "   → Applying: $filename"
        su -s /bin/sh postgres -c "psql -h /run/postgresql -d ${DB_NAME} -f $sql_file" 2>/dev/null || warn "Migration $filename had warnings (may already exist)"
    done
    touch "$MARKER_FILE"
    ok "All migrations applied"
else
    ok "Migrations already applied, skipping"
fi

# ── 5. Stop temporary PostgreSQL (supervisor will manage it) ──
log "🔄 Handing off PostgreSQL to supervisor..."
su -s /bin/sh postgres -c "pg_ctl -D $PGDATA stop -m fast" 2>/dev/null || true
sleep 1

# ── 6. Start Redis to verify ─────────────────────────────────
log "🔴 Pre-checking Redis..."
redis-server --bind 127.0.0.1 --port 6379 --daemonize yes --logfile /tmp/redis-precheck.log 2>/dev/null || true
sleep 1
redis-cli -h 127.0.0.1 ping 2>/dev/null && ok "Redis connectivity verified" || warn "Redis pre-check skipped"
redis-cli -h 127.0.0.1 shutdown nosave 2>/dev/null || true
sleep 1

# ── 7. Write .env for Go API ─────────────────────────────────
cat > /app/api/.env << EOF
PORT=${PORT}
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
DB_NAME=${DB_NAME}
DB_SSLMODE=${DB_SSLMODE}
JWT_SECRET=${JWT_SECRET}
REDIS_ADDR=127.0.0.1:6379
EOF

# ── 8. Handoff to supervisord ────────────────────────────────
echo ""
log "═══════════════════════════════════════════"
ok "✅ All services initialized!"
log "   🌐 Web  → http://localhost:5400"
log "   🔌 API  → http://localhost:8081/api/v1"
log "   🐘 DB   → localhost:5432 (db: ${DB_NAME})"
log "   🔴 Redis → localhost:6379"
log "═══════════════════════════════════════════"
echo ""

exec /usr/bin/supervisord -c /etc/supervisord.conf
