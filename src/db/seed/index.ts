/** CLI: `npm run db:seed`. App also seeds itself at boot (see src/db/bootstrap.ts). */
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../schema';
import { seedAll } from './seed';

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');

  const pool = new Pool({ connectionString: url });
  try {
    const result = await seedAll(drizzle(pool, { schema }));
    console.log(
      `vendors: ${result.vendorsInserted} inserted, ${result.vendorsSkipped} already existed`,
    );
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
