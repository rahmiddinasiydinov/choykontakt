import type { Database } from '../db.module';
import { vendors } from '../schema';
import { ASAKA_VENDORS } from './vendors.asaka';

export interface SeedResult {
  vendorsInserted: number;
  vendorsSkipped: number;
}

/** Idempotent: rows with existing (city, name) are skipped. */
export async function seedVendors(db: Database): Promise<SeedResult> {
  const rows = ASAKA_VENDORS.map((v) => ({
    name: v.name,
    city: 'Asaka',
    phones: v.phones,
  }));
  if (!rows.length) return { vendorsInserted: 0, vendorsSkipped: 0 };

  const inserted = await db
    .insert(vendors)
    .values(rows)
    .onConflictDoNothing({ target: [vendors.city, vendors.name] })
    .returning({ id: vendors.id });

  return {
    vendorsInserted: inserted.length,
    vendorsSkipped: rows.length - inserted.length,
  };
}

/** Entry point for all seeds. Add new seeders here. */
export async function seedAll(db: Database): Promise<SeedResult> {
  return seedVendors(db);
}
