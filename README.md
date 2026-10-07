# choykontakt

Telegram bot + REST API for choyxona directory. NestJS 11, nestjs-telegraf, Drizzle ORM, Postgres.

## Deploy (Docker)

```bash
cp .env.example .env      # set TELEGRAM_BOT_TOKEN, POSTGRES_PASSWORD
docker compose up -d --build
```

That is everything. On start the app waits for Postgres, applies migrations from `./drizzle`,
seeds reference data (idempotent), then serves:

- API: `http://localhost:3000/api`
- Swagger: `http://localhost:3000/docs`
- Health: `http://localhost:3000/health`

Logs: `docker compose logs -f app`. Update: `git pull && docker compose up -d --build`.

## Run without Docker

Needs Node 24 and a reachable Postgres (`DATABASE_URL` in `.env`).

```bash
npm ci
npm run build
npm run start:prod      # same boot sequence: wait -> migrate -> seed -> serve
```

## Develop

```bash
docker compose up db -d
npm run start:dev
```

Schema change: edit `src/db/schema/*`, run `npm run db:generate`, commit `drizzle/`.
Migration applies automatically on next start.

## Env

| Var | Default | Purpose |
|-----|---------|---------|
| `TELEGRAM_BOT_TOKEN` | — | required |
| `BOT_DISABLED` | `false` | `true` = REST/Swagger only, no Telegram polling |
| `DATABASE_URL` | — | required (compose sets it to service `db`) |
| `PORT` | `3000` | |
| `RUN_MIGRATIONS` / `RUN_SEED` | `true` | boot steps |
| `DB_WAIT_ATTEMPTS` / `DB_WAIT_DELAY_MS` | `30` / `2000` | DB readiness retry |
