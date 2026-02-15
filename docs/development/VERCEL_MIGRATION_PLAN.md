# Migration Plan: VPS → Vercel (Lean Next.js + NextAuth + Neon)

This document is the master plan to abandon the current VPS deployment, remove all Docker/WordPress/DevOps complexity, and end up with a **lean, performant, secure** Next.js app on **Vercel** using **NextAuth** and an external **Neon** PostgreSQL database.

---

## Goals

- **Remove:** All Docker, docker-compose, Nginx, Certbot, Redis, WordPress, and VPS-specific scripts/docs.
- **Keep:** Next.js app, NextAuth (Credentials + Email with Resend), Prisma + Neon PostgreSQL, existing app features.
- **Result:** Single-command deploy via Vercel (git push → build → deploy), no server maintenance.

---

## Phase 1: Remove VPS and Docker

### 1.1 Delete Docker and production stack

| Remove | Reason |
|--------|--------|
| `docker/` (entire directory) | Dockerfile, docker-compose.production.yml, nginx configs, wordpress compose/Dockerfile, certbot – no longer used |
| `.github/workflows/deploy-production.yml` | VPS SSH/rsync/docker-compose deploy – replace with Vercel (and optional lightweight CI) |

### 1.2 Delete or archive VPS/DevOps scripts

| Directory / Files | Action |
|-------------------|--------|
| `scripts/build/` | **Delete** – deploy-production.sh, compose-production.sh (Docker/VPS only) |
| `scripts/server/` | **Delete** – health-check-vps.sh, SSL/nginx/504/server checks, security-incident, etc. |
| `scripts/wordpress/` | **Delete** – setup, migrate-*, fix-*, generate-wordpress-env (WordPress managed externally) |
| `scripts/monitoring/` | **Delete** – monit, logwatch, Docker checks (VPS-specific) |
| `scripts/dev/server-setup.sh`, `scripts/dev/ssl-renewal.sh` | **Delete** – server/SSL on VPS |

Keep: `scripts/utils/`, `scripts/db/`, `scripts/migrate-*.js`, other app-related scripts that don’t reference Docker/VPS/WordPress.

---

## Phase 2: Roll Back WordPress Integration

### 2.1 Code and config

- **`app/lib/database/db.js`** – **Delete.** MySQL pool; unused (no imports in app). Used for WordPress/legacy only.
- **`package.json`** – Remove dependency: **`mysql2`** (only used by db.js).
- No other app code references WordPress, bhgv.evidoxa.com, or MySQL; Prisma uses PostgreSQL (Neon) only.

### 2.2 Docs to remove or archive (WordPress / VPS)

Remove or move to an `docs/archive/` (or delete) so the repo stays lean:

- `docs/development/WORDPRESS_THEME_MIGRATION.md`
- `docs/development/WORDPRESS_INTEGRATION.md`
- `docs/development/REPO_CHANGES_FOR_WORDPRESS.md`
- `docs/development/FINAL_WORDPRESS_SETUP.md`
- `docs/development/VPS_HEALTH_CHECK.md`
- `docs/development/DEPLOY_SSL_FLOW.md`
- `docs/development/SSL_WILDCARD_IONOS.md`
- `docs/development/SSL_SETUP.md`
- `docs/development/SERVER_SETUP.md`
- `docs/development/PRE_MERGE_CHECKLIST.md` (VPS/Docker/WordPress-heavy – replace with short “Pre-merge” for Vercel)
- `docs/development/MONITORING_SETUP_GUIDE.md`
- `docs/development/MONIT_WEB_INTERFACE_ACCESS.md`
- `docs/development/MONITORING_ALERTING_RECOMMENDATION.md`
- `docs/development/LOGWATCH_*.md`
- `docs/development/DEPLOYMENT_WARNING.md`
- `docs/development/DEPLOYMENT_SAFETY.md`
- `docs/development/DEPLOYMENT.md` (update to “Deploy on Vercel” only)

### 2.3 Update KEY_ROTATION.md

- Remove: VPS_SSH_KEY, REDIS_*, MYSQL_*, DOMAIN/SSL_EMAIL (for Certbot), IONOS_DNS_* (if only used for VPS/SSL), AUTHKIT_REDIRECT_URI if unused.
- Keep: NEXTAUTH_SECRET, NEXTAUTH_URL, DATABASE_URL, DATABASE_URL_UNPOOLED, RESEND_API_KEY, EMAIL_FROM, ENCRYPTION_KEY, JWT_SECRET, MENDELEY_*.
- Add: “Set these in Vercel Project → Settings → Environment Variables (and/or GitHub repo secrets if you run migrations in CI).”

---

## Phase 3: Vercel and App Configuration

### 3.1 Vercel config

- **Root `vercel.json`:** Vercel looks for `vercel.json` in the **project root**. You have `config/vercel.json` – either:
  - **Copy** (or move) to root `vercel.json`, or
  - Ensure your Vercel project is set to use `config` as root and that it picks up that file (less common).
- Recommended **root `vercel.json`** (adjust if you already have one):

```json
{
  "framework": "nextjs",
  "buildCommand": "prisma generate && next build",
  "installCommand": "npm install",
  "env": { "NODE_ENV": "production" },
  "functions": { "app/api/**/*.ts": { "maxDuration": 30 } },
  "regions": ["iad1"]
}
```

- Do **not** use `prisma db push` in production build if you rely on migrations; use `prisma migrate deploy` in a build step or separate step (see 3.3).

### 3.2 Next.js config (for Vercel)

- **`config/next.config.mjs`:** Remove **`output: 'standalone'`**. Standalone is for self-hosted/Docker; Vercel uses its own output. Keeping it can cause unnecessary bundle behavior.
- Keep: `compress`, `poweredByHeader: false`, `images`, `experimental.optimizePackageImports`, security headers.

### 3.3 Build and database

- **package.json**
  - **Build:** Use `"build": "prisma generate && next build"` (already present). For Vercel, that’s enough if migrations are applied separately.
  - **vercel-build:** Currently `prisma generate && prisma db push && next build`. Prefer **migrations** in production:
    - Either: `"vercel-build": "prisma generate && prisma migrate deploy && next build"` (if you run migrations on Vercel build),
    - Or: remove `prisma db push` / `prisma migrate deploy` from build and run migrations from a one-off job or CI (e.g. `prisma migrate deploy`) after deploy. Many teams run `prisma migrate deploy` in CI or a post-deploy script; then Vercel build stays `prisma generate && next build`.
- **Neon:** Already in use (Prisma `datasource` with `DATABASE_URL` and `directUrl`). Set in Vercel:
  - `DATABASE_URL` (pooled, for app)
  - `DATABASE_URL_UNPOOLED` (direct, for migrations if you run them from Vercel or CI)

### 3.4 Environment variables (Vercel)

Set in **Vercel → Project → Settings → Environment Variables** (Production / Preview as needed):

| Variable | Purpose |
|----------|--------|
| `DATABASE_URL` | Neon pooled connection string |
| `DATABASE_URL_UNPOOLED` | Neon direct connection (migrations) |
| `NEXTAUTH_URL` | e.g. `https://evidoxa.com` (or your Vercel URL) |
| `NEXTAUTH_SECRET` | NextAuth JWT/cookie signing |
| `RESEND_API_KEY` | Email (Resend) |
| `EMAIL_FROM` | Sender address |
| `ENCRYPTION_KEY` | If used in app |
| `JWT_SECRET` | If used elsewhere |
| `MENDELEY_CLIENT_ID` / `MENDELEY_CLIENT_SECRET` / `MENDELEY_REDIRECT_URI` | If Mendeley OAuth is used |

Remove from Vercel (not needed): `REDIS_URL`, `REDIS_PASSWORD`, `MYSQL_*`, `WORDPRESS_*`, `DOMAIN`, `SSL_EMAIL`, `VPS_SSH_KEY`, `IONOS_*` (unless still used by app), `AUTHKIT_REDIRECT_URI` (unless used).

---

## Phase 4: CI (optional but recommended)

Replace the current VPS deploy workflow with a **CI-only** workflow that does not deploy:

- **Trigger:** On push/PR to `main` (and optionally PR to main).
- **Steps:** Checkout → Node setup → `npm ci` → `npm run lint` → `npm run type-check` → (optional) `npm test` → (optional) `npm run build` to catch build failures.
- **No SSH, no rsync, no Docker.** Deployment is done by Vercel (connect repo in Vercel dashboard; Vercel deploys on push to main).

Example name: `.github/workflows/ci.yml`. You can delete or rename the old `deploy-production.yml` so it no longer runs.

---

## Phase 5: Security and Lean Checklist

- **API security:** Already addressed in `API_SECURITY_AUDIT.md` (auth, rate limits, no env disclosure in prod). Keep that doc; optionally add a note that production is Vercel and secrets live in Vercel.
- **Health:** `/api/health` is fine for Vercel; optionally restrict to internal or strip version/uptime in production if desired.
- **Debug:** Ensure `/api/debug/env` returns 404 in production (audit doc already suggests this).
- **Dependencies:** After removing `mysql2`, run `npm install` and `npm run build` to confirm nothing breaks.
- **No Redis:** App code does not use Redis; it was only in Docker/env for future/cache. No change needed in app code for removing Redis.

---

## Phase 6: Order of Execution (recommended)

1. **Create branch** (e.g. `feat/vercel-migration`).
2. **Phase 1:** Delete `docker/`, replace/remove `.github/workflows/deploy-production.yml` (add `ci.yml` if desired).
3. **Phase 2:** Delete `app/lib/database/db.js`, remove `mysql2` from package.json, delete or archive WordPress/VPS docs, update KEY_ROTATION.md.
4. **Phase 3:** Add or move `vercel.json` to root, remove `output: 'standalone'` from next.config, decide vercel-build (migrate deploy vs. external migrations), document env vars for Vercel.
5. **Phase 4:** Add CI workflow, disable old workflow.
6. **Test:** `npm run lint`, `npm run type-check`, `npm run build` locally with Neon env vars. Fix any broken imports (e.g. any stray reference to `db.js`).
7. **Vercel:** Connect repo, set env vars, deploy. If you use migrations, run `prisma migrate deploy` once (e.g. from laptop or CI) against production DB.
8. **DNS:** Point evidoxa.com to Vercel (CNAME or A record as per Vercel docs).
9. **Cleanup:** Remove or archive remaining VPS/WordPress docs, then merge.

---

## Summary: What You End Up With

- **Single app:** Next.js on Vercel, no Docker, no Nginx, no Certbot, no Redis, no WordPress in this repo.
- **Auth:** NextAuth (Credentials + Email/Resend) with Prisma adapter; JWT sessions.
- **Data:** Neon PostgreSQL via Prisma (unchanged schema).
- **Deploy:** Push to main → Vercel builds and deploys; optional CI for lint/type-check/test/build.
- **Secrets:** All in Vercel (and optionally in GitHub for CI); KEY_ROTATION.md updated for Vercel + Neon only.

WordPress (e.g. bhgv.evidoxa.com) is hosted and managed elsewhere; this project is only the historian app.
