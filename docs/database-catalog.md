# Database-backed curriculum

Kodergarden uses PostgreSQL for published campaigns and challenges. Live sessions remain intentionally in memory.

## Local setup

```powershell
docker compose up -d postgres
$env:DATABASE_URL='postgresql://kodergarden:kodergarden@127.0.0.1:55432/kodergarden'
pnpm --filter @kodergarden/server migration:run
pnpm --filter @kodergarden/server catalog:seed
$env:ADMIN_EMAIL='admin@example.com'
$env:ADMIN_PASSWORD='use-a-unique-password-of-at-least-12-characters'
$env:ADMIN_DISPLAY_NAME='Team Admin'
pnpm --filter @kodergarden/server admin:seed
pnpm dev
```

The seed is idempotent: it creates the built-in catalog only when a campaign does not yet have a published revision. It never deletes or overwrites an existing published revision.

## Production rollout

Set `DATABASE_URL` and, when required by the provider, `DATABASE_SSL=true`. Before starting a new application image, run:

```bash
pnpm --filter @kodergarden/server migration:run
pnpm --filter @kodergarden/server catalog:seed
pnpm start
```

Application startup fails when migrations are pending. `/readyz` returns HTTP 503 when PostgreSQL is unreachable. `/healthz` remains a process-liveness check.

## Catalog API

- `GET /api/catalog?locale=en` returns published campaign summaries.
- `GET /api/campaigns/:slug?locale=en` returns one complete published revision.

Supported seed locales are `en` and `es`; unsupported locale values fall back to English. Live Classroom loads a published catalog snapshot at server startup and records the campaign revision ID on each round.

## Team admin

After running `admin:seed`, open `/admin`. The command creates the user only when the normalized email does not already exist; it never resets an existing password. Admin sessions expire after 12 hours and use an opaque, HttpOnly, `SameSite=Strict` cookie. Production cookies require HTTPS.

An administrator can clone the current published campaign into one isolated draft, edit English and Spanish campaign/challenge copy, duplicate, remove, and reorder challenges, configure allowed tools and block/step limits, paint default and dynamic grid layouts, and build starter and reference programs. A readiness check runs reference programs against every layout and publishing rejects failing solutions. Legacy challenges without a reference program remain publishable while they are migrated. Learner APIs never return drafts. Publication atomically advances the campaign's published revision pointer, and draft creation, updates, and publication are recorded in `curriculum_audit_events`.

## Verification

The database test refuses to run unless the database name is exactly `kodergarden_test`:

```powershell
docker exec kodergardenplatform-postgres-1 createdb -U kodergarden kodergarden_test
$env:DATABASE_URL='postgresql://kodergarden:kodergarden@127.0.0.1:55432/kodergarden_test'
pnpm test:database
```
