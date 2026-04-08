# PMX Pharma Exchange - Complete Deployment Guide

**IMPORTANT: Keep this file secure - contains deployment procedures and configuration**

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Technology Stack](#technology-stack)
3. [Environment Configuration](#environment-configuration)
4. [Local Development Setup](#local-development-setup)
5. [Database Setup](#database-setup)
6. [Docker Deployment](#docker-deployment)
7. [Quick Deployment Commands](#quick-deployment-commands)
8. [Nginx Configuration](#nginx-configuration)
9. [SSL/TLS Configuration](#ssltls-configuration)
10. [Application Credentials](#application-credentials)
11. [Monitoring & Health Checks](#monitoring--health-checks)
12. [Database Management](#database-management)
13. [Troubleshooting](#troubleshooting)
14. [Security Checklist](#security-checklist)
15. [Critical Warnings](#critical-warnings)

---

## System Architecture

### Planned Production Setup

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        PMX PHARMA EXCHANGE ARCHITECTURE                       │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────┐  ┌─────────────────────────┐                   │
│  │   APPLICATION SERVER    │  │    DATABASE SERVER      │                   │
│  │                         │  │                         │                   │
│  │  ┌─────────────────┐    │  │  ┌─────────────────┐    │                   │
│  │  │    pmx-app      │────┼──┼──│   PostgreSQL    │    │                   │
│  │  │  (port 5556)    │    │  │  │   (port 5432)   │    │                   │
│  │  └─────────────────┘    │  │  └─────────────────┘    │                   │
│  │                         │  │                         │                   │
│  │  Next.js 14 App Router  │  │  PostgreSQL 18          │                   │
│  │  Node.js 20.x           │  │  40 tables              │                   │
│  │                         │  │  Audit triggers          │                   │
│  └─────────────────────────┘  └─────────────────────────┘                   │
│                                                                              │
│  Public URL: https://pmx.com.pk (planned)                                    │
│  Marketplace: / (public, no auth)                                            │
│  Login: /login                                                               │
│  Portals: /seller/*, /buyer/*, /admin/* (authenticated)                      │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │                    NGINX (Reverse Proxy)                              │    │
│  │  Routes:                                                              │    │
│  │    pmx.com.pk → localhost:5556 (pmx-app)                              │    │
│  │    marketplace.pmx.com.pk → localhost:5556 (same app, public routes)  │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Application Structure

| Component | Port | Purpose |
|-----------|------|---------|
| `pmx-app` | 5556 | Next.js PMX application |
| PostgreSQL | 5432 | Database (40 tables + audit triggers) |

**Route Structure:**
- `/` → Marketplace landing (public, redirects to /marketplace)
- `/marketplace/*` → Public storefront (search, products, sellers)
- `/login` → Authentication page
- `/seller/*` → Seller portal (10 pages, requires SELLER_* role)
- `/buyer/*` → Buyer portal (6 pages, requires BUYER_* role)
- `/admin/*` → Admin portal + CMS (16 pages, requires PMX_ADMIN role)
- `/api/*` → 66 API routes

---

## Technology Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Framework | Next.js (App Router) | 14.2.x |
| Runtime | Node.js | 20.x |
| Language | TypeScript | 5.x |
| Database | PostgreSQL | 18.x |
| DB Access | pg (raw SQL, no ORM) | 8.x |
| Auth | jose (JWT) + bcryptjs | Latest |
| UI | Tailwind CSS + shadcn/ui | Latest |
| State | Zustand | Latest |
| PDF | pdf-lib + qrcode | Latest |
| Charts | recharts | Latest |
| Forms | React Hook Form + Zod | Latest |
| E2E Tests | Puppeteer | Latest |

---

## Environment Configuration

### Development (.env.local)

```env
# Database - Local PostgreSQL
DATABASE_URL=postgresql://postgres:password@localhost:5432/pmx_prototype
 
# JWT Authentication
JWT_SECRET=pmx-prototype-secret-key-minimum-32-chars-long

# Application
NEXTAUTH_URL=http://localhost:5556
PORT=5556
```

### Production (.env.production)

```env
# Database - Production PostgreSQL
DATABASE_URL=postgresql://pmx_user:CHANGE_ME_STRONG_PASSWORD@DB_HOST:5432/pmx_production

# JWT Authentication - MUST be unique and at least 32 chars
JWT_SECRET=CHANGE_ME_PRODUCTION_SECRET_KEY_MINIMUM_32_CHARACTERS

# Application
NEXTAUTH_URL=https://pmx.com.pk
NODE_ENV=production
PORT=5556
```

### Staging (.env.staging)

```env
# Database - Staging PostgreSQL (separate from production!)
DATABASE_URL=postgresql://pmx_user:STAGING_PASSWORD@DB_HOST:5432/pmx_staging

# JWT Authentication
JWT_SECRET=CHANGE_ME_STAGING_SECRET_KEY_MINIMUM_32_CHARACTERS

# Application
NEXTAUTH_URL=https://staging.pmx.com.pk
NODE_ENV=production
PORT=5556
```

### Critical Environment Variables

| Variable | Required For | What Happens If Missing |
|----------|-------------|------------------------|
| `DATABASE_URL` | Everything | App crashes on start |
| `JWT_SECRET` | Auth, sessions | Tokens invalid, users can't login |
| `NEXTAUTH_URL` | Cookie domain, redirects | Auth flow breaks |
| `PORT` | Server binding | Defaults to 3000 (may conflict) |

**NEVER use the same database for staging and production.** PMX stores pharmaceutical compliance data — staging data corruption could affect real regulatory records.

---

## Local Development Setup

### Prerequisites

- Node.js 20.x
- PostgreSQL 18.x (running locally)
- npm 11.x

### First-Time Setup

```bash
# 1. Clone repository
git clone https://github.com/mjqazi/PMExchange.git
cd PMExchange/pmx-prototype

# 2. Install dependencies
npm install

# 3. Create database
sudo -u postgres psql -c "CREATE DATABASE pmx_prototype;"

# 4. Set postgres password (for TCP connections)
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'password';"

# 5. Ensure pg_hba.conf uses md5 for localhost
# Check: sudo grep "host.*all.*all.*127" /etc/postgresql/18/main/pg_hba.conf
# Should be: host all all 127.0.0.1/32 md5
# If it says scram-sha-256, change to md5 and reload:
# sudo sed -i 's/scram-sha-256/md5/g' /etc/postgresql/18/main/pg_hba.conf
# sudo systemctl reload postgresql

# 6. Run database schema
sudo -u postgres psql -d pmx_prototype -f scripts/schema.sql

# 7. Run seed data
sudo -u postgres psql -d pmx_prototype -f scripts/seed.sql
sudo -u postgres psql -d pmx_prototype -f scripts/seed-demo.sql

# 8. Run CMS schema
sudo -u postgres psql -d pmx_prototype -f scripts/schema-cms.sql

# 9. Run QC templates
sudo -u postgres psql -d pmx_prototype -f scripts/schema-qc-templates.sql

# 10. Run drug dictionary
sudo -u postgres psql -d pmx_prototype -f scripts/schema-drug-dictionary.sql

# 11. Create .env.local
cat > .env.local << 'EOF'
DATABASE_URL=postgresql://postgres:password@localhost:5432/pmx_prototype
JWT_SECRET=pmx-prototype-secret-key-minimum-32-chars-long
NEXTAUTH_URL=http://localhost:5556
PORT=5556
EOF

# 12. Start development server
npx next dev -p 5556
```

### Development Server

```bash
# Start dev server (port 5556)
npx next dev -p 5556

# Build for production
npx next build

# Start production server
npx next start -p 5556

# Run E2E tests
node e2e/pmx-full-test.js
```

**Port assignments (do NOT change):**
- **5556** → PMX Pharma Exchange
- **3000** → Reserved for QuoteCraft
- **4444** → Reserved for MDI

---

## Database Setup

### Schema Files (Run in Order)

| # | File | Tables | Purpose |
|---|------|--------|---------|
| 1 | `scripts/schema.sql` | 30 tables | Core schema: users, manufacturers, buyers, products, batches, orders, RFQs, audit log |
| 2 | `scripts/seed.sql` | — | Base seed: 5 manufacturers, 3 buyers, 5 users, 4 products, academy modules |
| 3 | `scripts/seed-demo.sql` | — | Demo data: batches, orders, RFQs, messages, notifications, CoAs, deviations |
| 4 | `scripts/schema-cms.sql` | 10 tables | CMS: pages, articles, banners, media, settings, templates, categories, analytics |
| 5 | `scripts/schema-qc-templates.sql` | 1 table | QC test templates (30 tests across 4 products) |
| 6 | `scripts/schema-drug-dictionary.sql` | 1 table | Drug dictionary (27 INNs across 6 categories) |

**Total: 42 tables**

### Full Database Reset

```bash
# Drop and recreate
sudo -u postgres psql -c "DROP DATABASE IF EXISTS pmx_prototype;"
sudo -u postgres psql -c "CREATE DATABASE pmx_prototype;"

# Run all schemas and seeds in order
sudo -u postgres psql -d pmx_prototype -f scripts/schema.sql
sudo -u postgres psql -d pmx_prototype -f scripts/seed.sql
sudo -u postgres psql -d pmx_prototype -f scripts/seed-demo.sql
sudo -u postgres psql -d pmx_prototype -f scripts/schema-cms.sql
sudo -u postgres psql -d pmx_prototype -f scripts/schema-qc-templates.sql
sudo -u postgres psql -d pmx_prototype -f scripts/schema-drug-dictionary.sql
```

### Backup & Restore

```bash
# Backup
pg_dump -h localhost -U postgres pmx_prototype > pmx_backup_$(date +%Y%m%d).sql

# Restore
psql -h localhost -U postgres pmx_prototype < pmx_backup_YYYYMMDD.sql
```

---

## Docker Deployment

### Dockerfile

Create `Dockerfile` in `pmx-prototype/`:

```dockerfile
FROM node:20-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Build application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production runtime
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5556

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 5556

CMD ["node", "server.js"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  pmx-app:
    build: .
    container_name: pmx-app
    restart: unless-stopped
    ports:
      - "5556:5556"
    env_file:
      - .env.production
    depends_on:
      pmx-db:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:5556/api/auth/login"]
      interval: 30s
      timeout: 10s
      retries: 3

  pmx-db:
    image: postgres:18-alpine
    container_name: pmx-db
    restart: unless-stopped
    environment:
      POSTGRES_DB: pmx_production
      POSTGRES_USER: pmx_user
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - pmx_pgdata:/var/lib/postgresql/data
      - ./scripts:/docker-entrypoint-initdb.d
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U pmx_user -d pmx_production"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  pmx_pgdata:
```

### Build & Deploy

```bash
# Build and start
docker compose build --no-cache
docker compose up -d

# Check status
docker compose ps
docker compose logs pmx-app --tail 50

# Restart app only
docker compose restart pmx-app

# Full rebuild
docker compose down
docker compose build --no-cache
docker compose up -d
```

---

## Quick Deployment Commands

### Deploy to Production

```bash
# From local development machine
rsync -avz --exclude 'node_modules' --exclude '.next' --exclude '.git' \
  --exclude 'e2e/screenshots' --exclude '.env.local' --exclude '.env.production' \
  /home/junaid/Documents/GitHub/PMExchange/pmx-prototype/ \
  user@PRODUCTION_IP:/home/user/pmx-app/ && \
ssh user@PRODUCTION_IP "cd /home/user/pmx-app && \
  docker compose build --no-cache pmx-app && \
  docker compose up -d && \
  sleep 5 && docker exec pmx-app wget -q --spider http://localhost:5556/marketplace && echo 'HEALTHY'"
```

### Deploy to Staging

```bash
rsync -avz --exclude 'node_modules' --exclude '.next' --exclude '.git' \
  --exclude 'e2e/screenshots' --exclude '.env.local' --exclude '.env.production' \
  /home/junaid/Documents/GitHub/PMExchange/pmx-prototype/ \
  user@STAGING_IP:/home/user/pmx-app/ && \
ssh user@STAGING_IP "cd /home/user/pmx-app && \
  docker compose build --no-cache pmx-app && \
  docker compose up -d && \
  sleep 5 && docker exec pmx-app wget -q --spider http://localhost:5556/marketplace && echo 'HEALTHY'"
```

---

## Nginx Configuration

### Reverse Proxy (Production)

```nginx
server {
    listen 80;
    server_name pmx.com.pk www.pmx.com.pk;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name pmx.com.pk www.pmx.com.pk;

    ssl_certificate /etc/letsencrypt/live/pmx.com.pk/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/pmx.com.pk/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Proxy to PMX app
    location / {
        proxy_pass http://localhost:5556;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts for large PDF generation
        proxy_read_timeout 120s;
        proxy_send_timeout 120s;
    }

    # Static assets caching
    location /_next/static/ {
        proxy_pass http://localhost:5556;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, immutable, max-age=31536000";
    }

    # Media uploads
    location /uploads/ {
        proxy_pass http://localhost:5556;
        proxy_cache_valid 200 30d;
        add_header Cache-Control "public, max-age=2592000";
    }

    # File size limit for media uploads
    client_max_body_size 50M;
}
```

---

## SSL/TLS Configuration

### Let's Encrypt (Certbot)

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d pmx.com.pk -d www.pmx.com.pk

# Auto-renewal (already set up by certbot)
sudo certbot renew --dry-run
```

---

## Application Credentials

### Demo Users

| User | Email | Password | Role | Portal |
|------|-------|----------|------|--------|
| Seller Admin | `admin@lahoregenerics.pk` | `PMX@prototype2026` | SELLER_ADMIN | /seller/* |
| Seller QA | `qa@lahoregenerics.pk` | `PMX@prototype2026` | SELLER_QA | /seller/* |
| Seller Operator | `ops@lahoregenerics.pk` | `PMX@prototype2026` | SELLER_OPERATOR | /seller/* |
| Buyer | `buyer@gulfmedical.sa` | `PMX@prototype2026` | BUYER_ADMIN | /buyer/* |
| PMX Admin | `admin@pmx.com.pk` | `PMX@prototype2026` | PMX_ADMIN | /admin/* |

### Application URLs

| Page | URL |
|------|-----|
| Marketplace (public) | https://pmx.com.pk/ |
| Product Search | https://pmx.com.pk/marketplace/search |
| Login | https://pmx.com.pk/login |
| Seller Dashboard | https://pmx.com.pk/seller/dashboard |
| Buyer Dashboard | https://pmx.com.pk/buyer/dashboard |
| Admin Dashboard | https://pmx.com.pk/admin/dashboard |
| Health Check | https://pmx.com.pk/api/auth/login (POST) |

---

## Monitoring & Health Checks

### Health Check Endpoints

```bash
# API health (should return 200 with JSON)
curl -s http://localhost:5556/api/auth/login -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test","password":"test"}' | python3 -c "
import sys,json
d=json.load(sys.stdin)
print('HEALTHY' if 'error' in d or 'success' in d else 'UNHEALTHY')
"

# Marketplace (should return 200)
curl -s -o /dev/null -w "%{http_code}" http://localhost:5556/marketplace

# Database connectivity
PGPASSWORD=password psql -U postgres -h localhost -d pmx_prototype -c "SELECT 1"
```

### Docker Container Monitoring

```bash
# Check container status
docker compose ps

# View real-time logs
docker compose logs -f pmx-app

# Check resource usage
docker stats pmx-app pmx-db

# Restart if unhealthy
docker compose restart pmx-app
```

### Database Monitoring

```bash
# Active connections
sudo -u postgres psql -d pmx_prototype -c "SELECT count(*) FROM pg_stat_activity WHERE datname='pmx_prototype';"

# Table sizes
sudo -u postgres psql -d pmx_prototype -c "
SELECT relname AS table, pg_size_pretty(pg_total_relation_size(relid)) AS size
FROM pg_catalog.pg_statio_user_tables ORDER BY pg_total_relation_size(relid) DESC LIMIT 10;
"

# Audit log growth
sudo -u postgres psql -d pmx_prototype -c "SELECT count(*) FROM audit_log;"
```

---

## Database Management

### Running Migrations

PMX uses raw SQL files, not an ORM migration system. To add new tables:

1. Create `scripts/schema-{feature}.sql`
2. Run: `sudo -u postgres psql -d pmx_prototype -f scripts/schema-{feature}.sql`
3. Add to the setup sequence in this document

### Audit Log

The audit log is **immutable** — database rules prevent UPDATE or DELETE:

```sql
-- These rules are enforced at the database level
CREATE RULE no_update_audit AS ON UPDATE TO audit_log DO INSTEAD NOTHING;
CREATE RULE no_delete_audit AS ON DELETE TO audit_log DO INSTEAD NOTHING;
```

All critical tables have AFTER triggers that log every INSERT, UPDATE, DELETE to `audit_log`.

### CQS Recalculation

The Compliance Quality Score recalculates automatically on batch release. To force recalculate:

```bash
# Via API (requires admin token)
TOKEN=$(curl -s http://localhost:5556/api/auth/login -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@pmx.com.pk","password":"PMX@prototype2026"}' | \
  python3 -c "import sys,json; print(json.load(sys.stdin)['data']['accessToken'])")

curl -b "pmx_token=$TOKEN" http://localhost:5556/api/admin/cron/timeouts -X POST
```

---

## Troubleshooting

### Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| Login returns "Internal Error" | PostgreSQL password auth failure | `sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'password';"` |
| `EADDRINUSE: port 5556` | Previous server still running | `lsof -ti:5556 \| xargs kill -9` |
| Stale `.next` cache errors | Webpack chunk mismatch | `rm -rf .next && npx next dev -p 5556` |
| `[object Object]` in UI | Error object displayed as string | Check error handling: `data.error?.message` not `data.error` |
| Products dropdown empty | API fetch timing | Refresh page; products load after auth check completes |
| Marketplace shows 404 | Server needs restart after code change | Restart with `rm -rf .next` |

### PostgreSQL Authentication

If the dev server shows DB auth errors repeatedly:

```bash
# Fix permanently: change pg_hba.conf from scram-sha-256 to md5
sudo sed -i 's/scram-sha-256/md5/g' /etc/postgresql/18/main/pg_hba.conf
sudo systemctl reload postgresql
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'password';"
```

### Log Locations

| Log | Location |
|-----|----------|
| Dev server | `/tmp/pmx-dev.log` (when using nohup) |
| Docker app | `docker compose logs pmx-app` |
| Docker db | `docker compose logs pmx-db` |
| PostgreSQL | `/var/log/postgresql/` |
| Nginx | `/var/log/nginx/access.log` and `error.log` |
| E2E screenshots | `e2e/screenshots/` |

---

## Security Checklist

### Authentication & Authorization

- [x] JWT tokens with 1-hour expiry (httpOnly cookie)
- [x] Refresh tokens with 30-day expiry
- [x] 3-session limit per user (oldest revoked on 4th)
- [x] 5-attempt lockout for 15 minutes
- [x] Role-based access control (7 roles)
- [x] Middleware validates JWT signature on protected routes
- [x] API routes verify auth independently
- [x] Cookies: httpOnly, secure (in production), sameSite: lax

### Data Security

- [x] All SQL queries parameterized (no string interpolation)
- [x] No `dangerouslySetInnerHTML` anywhere
- [x] No hardcoded secrets in client code
- [x] Audit log immutable (DB-enforced rules)
- [x] 21 CFR Part 11 e-signatures with SHA-256 hashes
- [x] Password hashing with bcryptjs (cost 12)

### Infrastructure

- [ ] HTTPS with TLS 1.3 (configure in Nginx)
- [ ] Database encrypted at rest
- [ ] Regular automated backups
- [ ] Firewall restricts database port to app server only
- [ ] Monitoring and alerting configured

---

## Critical Warnings

1. **NEVER use the same database for staging and production.** Pharmaceutical compliance data must be isolated.

2. **NEVER expose PostgreSQL port to the internet.** Use firewall rules to restrict access to the app server only.

3. **NEVER deploy with the default JWT_SECRET.** Generate a unique 32+ character secret for each environment.

4. **NEVER delete the audit_log table.** It's required for pharmaceutical regulatory compliance (21 CFR Part 11).

5. **NEVER skip the database backup before schema changes.** Run `pg_dump` before any migration.

6. **NEVER use `killall node` on production.** Kill specific PIDs to avoid disrupting other services.

7. **Port 5556 is PMX.** Do not change it — port 3000 is QuoteCraft, port 4444 is MDI.

---

## E2E Test Verification

Before any deployment, verify all tests pass:

```bash
cd pmx-prototype

# Run full E2E suite (67 tests across all portals + marketplace + CMS)
node e2e/pmx-full-test.js

# Expected output:
# RESULTS: 67 passed, 0 failed, 0 skipped

# Screenshots saved to e2e/screenshots/ for visual verification
```

---

*Last updated: 2026-04-08*
*Maintained by: PMX Development Team*
