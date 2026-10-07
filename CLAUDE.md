# Choykontakt

Telegram bot + REST API for choyxona (tea house) directory. NestJS 11, nestjs-telegraf, Drizzle ORM (Postgres), Docker.

## Commands

- `docker compose up -d --build` — full deploy: Postgres + app. App waits for DB, migrates, seeds, serves.
- `npm run start:dev` — dev server (needs `TELEGRAM_BOT_TOKEN` and `DATABASE_URL` in `.env`); also migrates + seeds at boot
- `npm run build` / `npm run lint` / `npm test`
- `npm run db:generate` — create migration from `src/db/schema` (commit `drizzle/` output; app applies it at next start)
- `npm run db:migrate` / `npm run db:seed` — manual, normally not needed
- `docker compose up db -d` — only Postgres, for local dev

## Startup sequence (`src/main.ts` -> `src/db/bootstrap.ts`)

1. Wait for `DATABASE_URL` (`DB_WAIT_ATTEMPTS` x `DB_WAIT_DELAY_MS`).
2. `RUN_MIGRATIONS` (default true): apply `./drizzle` via drizzle-orm migrator.
3. `RUN_SEED` (default true): `seedAll()` in `src/db/seed/seed.ts`, idempotent. Add new seeders there.
4. Start Nest, Swagger at `/docs`, `GET /health` checks DB.

Failure in 1-3 exits with code 1; compose `restart: unless-stopped` retries.

## Layout

- `src/db/schema/*` — Drizzle tables. Export new tables from `src/db/schema/index.ts`.
- `src/db/db.module.ts` — global `DRIZZLE` provider, `Database` type.
- `src/db/bootstrap.ts` — pre-listen migrate + seed. `src/db/seed/` — seed data + `seedAll`.
- `src/users`, `src/vendors` — service + controller + `dto/*.dto.ts`.
- `src/bot` — Telegraf handlers. `@Use()` middleware upserts user on every update into `ctx.state.user`.
- `src/swagger.ts` — Swagger setup, served at `/docs` (JSON at `/docs/json`).

## Rules

- Nest 11, TypeScript 5, `@nestjs/swagger@11`, `@nestjs/config@4`. Do not upgrade to Nest 12 line: `nestjs-telegraf` peers are 10/11, and `@nestjs/config@12` is ESM-only which breaks jest.
- Types used only in decorated signatures must be `import type` (TS1272 under isolatedModules).
- **API docs must stay in sync with code.** Every change to a controller, route, DTO or response shape must update Swagger in the same change:
  - New/changed endpoint: JSDoc summary on the handler, `@ApiOkResponse`/`@ApiCreatedResponse` with `type`, `@ApiNotFoundResponse` etc. as applicable, `@ApiTags` on controller, tag registered in `src/swagger.ts`.
  - New/changed DTO: file ends in `.dto.ts` (Swagger CLI plugin reads it), class-validator decorators on inputs, JSDoc on non-obvious fields, `@ApiProperty({ enum })` for enums.
  - Bump `setVersion` in `src/swagger.ts` on breaking API changes.
  - Verify with `npm run build` then start app and check `/docs/json` includes the change.
- Global prefix `/api`; Swagger UI is outside prefix.
- Phones stored E.164 (`normalizePhone` in `vendors.service.ts`).
