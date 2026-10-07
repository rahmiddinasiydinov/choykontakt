import { Logger } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { resolve } from 'node:path';
import { Pool } from 'pg';
import * as schema from './schema';
import { seedAll } from './seed/seed';

const log = new Logger('DbBootstrap');

const MIGRATIONS_FOLDER = resolve(process.cwd(), 'drizzle');

function envFlag(name: string, defaultValue: boolean): boolean {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return defaultValue;
  return !['0', 'false', 'no', 'off'].includes(raw.toLowerCase());
}

async function waitForDb(pool: Pool, attempts: number, delayMs: number) {
  for (let i = 1; i <= attempts; i++) {
    try {
      await pool.query('select 1');
      return;
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message || (err as { code?: string }).code || err.name
          : String(err);
      log.warn(`DB not ready (${i}/${attempts}): ${msg}`);
      if (i === attempts) throw err;
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
}

/**
 * Runs before Nest starts listening: waits for Postgres, applies pending
 * migrations from ./drizzle, seeds reference data. Idempotent.
 *
 * Env:
 *  DB_WAIT_ATTEMPTS (default 30), DB_WAIT_DELAY_MS (default 2000)
 *  RUN_MIGRATIONS (default true), RUN_SEED (default true)
 */
export async function bootstrapDatabase(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');

  const pool = new Pool({ connectionString: url });
  try {
    await waitForDb(
      pool,
      Number(process.env.DB_WAIT_ATTEMPTS ?? 30),
      Number(process.env.DB_WAIT_DELAY_MS ?? 2000),
    );
    log.log('DB reachable');

    const db = drizzle(pool, { schema });

    if (envFlag('RUN_MIGRATIONS', true)) {
      await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
      log.log(`Migrations applied from ${MIGRATIONS_FOLDER}`);
    } else {
      log.log('RUN_MIGRATIONS=false, skipping migrations');
    }

    if (envFlag('RUN_SEED', true)) {
      const result = await seedAll(db);
      log.log(
        `Seed: vendors +${result.vendorsInserted} (${result.vendorsSkipped} existed)`,
      );
    } else {
      log.log('RUN_SEED=false, skipping seed');
    }
  } finally {
    await pool.end();
  }
}
