# Database-backed curriculum

Kodergarden uses PostgreSQL for published campaigns and challenges. Live sessions remain intentionally in memory.

## Local setup

```powershell
docker compose up -d postgres
$env:DATABASE_URL='postgresql://kodergarden:kodergarden@127.0.0.1:55432/kodergarden'
pnpm --filter @kodergarden/server migration:run
pnpm --filter @kodergarden/server catalog:seed
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

## Verification

The database test refuses to run unless the database name is exactly `kodergarden_test`:

```powershell
docker exec kodergardenplatform-postgres-1 createdb -U kodergarden kodergarden_test
$env:DATABASE_URL='postgresql://kodergarden:kodergarden@127.0.0.1:55432/kodergarden_test'
pnpm test:database
```
