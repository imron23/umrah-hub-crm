# ============================================================
# STAGE 1: Build Go API
# ============================================================
FROM golang:alpine AS api-builder
ENV GOTOOLCHAIN=auto

RUN apk add --no-cache git

WORKDIR /build/api
COPY apps/api/go.mod apps/api/go.sum ./
RUN go mod download

COPY apps/api/ .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /out/api-server ./cmd/api/main.go

# ============================================================
# STAGE 2: Build Next.js Web
# ============================================================
FROM node:20-alpine AS web-builder

WORKDIR /build/web
COPY apps/web/package*.json ./
RUN npm ci --prefer-offline

COPY apps/web/ .

# Build with standalone output for smaller image
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

# ============================================================
# STAGE 3: Final All-in-One Runtime Image
# ============================================================
FROM alpine:3.19

LABEL maintainer="Umrah Hub" \
      description="Umrah Hub Aggregator — All-in-One Docker Image" \
      version="1.0.0"

# Install: PostgreSQL, Redis, supervisor, Node.js, tzdata
RUN apk add --no-cache \
    postgresql16 \
    postgresql16-contrib \
    redis \
    supervisor \
    nodejs \
    npm \
    tzdata \
    curl \
    bash \
    && rm -rf /var/cache/apk/*

# Timezone
ENV TZ=Asia/Jakarta

# ── Copy API binary ──────────────────────────────────────────
COPY --from=api-builder /out/api-server /app/api/api-server
RUN chmod +x /app/api/api-server

# Copy SQL migrations
COPY apps/api/migrations/ /app/api/migrations/

# ── Copy Next.js build ───────────────────────────────────────
WORKDIR /app/web
COPY --from=web-builder /build/web/.next/standalone ./
COPY --from=web-builder /build/web/.next/static ./.next/static
COPY --from=web-builder /build/web/public ./public

# ── Non-sensitive environment defaults ───────────────────────
ENV PORT=8081 \
    DB_HOST=127.0.0.1 \
    DB_PORT=5432 \
    DB_USER=umrah \
    DB_NAME=umrah_hub \
    DB_SSLMODE=disable \
    REDIS_ADDR=127.0.0.1:6379 \
    NEXT_PUBLIC_API_URL=http://localhost:8081/api/v1 \
    NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1

# ── Sensitive defaults (OVERRIDE in production via -e flags) ──
# docker run -e DB_PASSWORD=mypass -e JWT_SECRET=mysecret ...
ENV DB_PASSWORD=umrah123 \
    JWT_SECRET=change_me_in_production_32chars!!

# ── PostgreSQL setup ─────────────────────────────────────────
ENV PGDATA=/var/lib/postgresql/data
RUN mkdir -p "$PGDATA" /run/postgresql \
    && chown -R postgres:postgres "$PGDATA" /run/postgresql \
    && chmod 700 "$PGDATA"

# ── Supervisor config ────────────────────────────────────────
COPY docker/supervisord.conf /etc/supervisord.conf

# ── Entrypoint script ────────────────────────────────────────
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 5400 8081 5432

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8081/api/v1/health || exit 1

ENTRYPOINT ["/entrypoint.sh"]
