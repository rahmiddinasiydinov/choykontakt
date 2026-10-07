import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { and, arrayContains, eq, SQL, sql } from 'drizzle-orm';
import { DRIZZLE } from '../db/db.module';
import type { Database } from '../db/db.module';
import { NewVendor, Vendor, VendorStatus, users, vendors } from '../db/schema';

export type CreateVendorInput = Omit<
  NewVendor,
  'id' | 'status' | 'createdAt' | 'updatedAt'
>;

export interface VendorFilter {
  city?: string;
  phone?: string;
  status?: VendorStatus;
}

const PG_UNIQUE_VIOLATION = '23505';

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: string }).code === PG_UNIQUE_VIOLATION
  );
}

/** Keeps digits and leading '+', e.g. "+998 94 388-10-34" -> "+998943881034". */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/[^\d]/g, '');
  return digits ? `+${digits}` : '';
}

@Injectable()
export class VendorsService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  /** Creates vendor; if owner given, promotes them to `vendor` role in same transaction. */
  async create(input: CreateVendorInput): Promise<Vendor> {
    try {
      return await this.db.transaction(async (tx) => {
        const [vendor] = await tx.insert(vendors).values(input).returning();
        if (input.ownerUserId) {
          await tx
            .update(users)
            .set({ role: 'vendor', updatedAt: sql`now()` })
            .where(eq(users.id, input.ownerUserId));
        }
        return vendor;
      });
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw new ConflictException(
          `Vendor "${input.name}" already exists in ${input.city}`,
        );
      }
      throw err;
    }
  }

  async findMany(filter: VendorFilter = {}): Promise<Vendor[]> {
    const where: SQL[] = [];
    if (filter.city) where.push(eq(vendors.city, filter.city));
    if (filter.status) where.push(eq(vendors.status, filter.status));
    if (filter.phone) {
      const phone = normalizePhone(filter.phone);
      if (!phone) return [];
      where.push(arrayContains(vendors.phones, [phone]));
    }
    return this.db.query.vendors.findMany({
      where: where.length ? and(...where) : undefined,
      orderBy: [vendors.city, vendors.name],
    });
  }

  /** Bulk insert; rows with same (city, name) are skipped. Returns inserted count. */
  async seed(rows: CreateVendorInput[]): Promise<number> {
    if (!rows.length) return 0;
    const inserted = await this.db
      .insert(vendors)
      .values(rows)
      .onConflictDoNothing({ target: [vendors.city, vendors.name] })
      .returning({ id: vendors.id });
    return inserted.length;
  }

  async findById(id: number): Promise<Vendor | undefined> {
    return this.db.query.vendors.findFirst({ where: eq(vendors.id, id) });
  }

  async findByOwner(ownerUserId: number): Promise<Vendor[]> {
    return this.db.query.vendors.findMany({
      where: eq(vendors.ownerUserId, ownerUserId),
    });
  }

  async findByPhone(rawPhone: string): Promise<Vendor[]> {
    const phone = normalizePhone(rawPhone);
    if (!phone) return [];
    return this.db.query.vendors.findMany({
      where: arrayContains(vendors.phones, [phone]),
    });
  }

  async findByCity(city: string): Promise<Vendor[]> {
    return this.db.query.vendors.findMany({
      where: eq(vendors.city, city),
      orderBy: vendors.name,
    });
  }

  /** Links vendor to Telegram user and promotes that user to `vendor`. */
  async assignOwner(
    vendorId: number,
    ownerUserId: number,
  ): Promise<Vendor | undefined> {
    return this.db.transaction(async (tx) => {
      const [vendor] = await tx
        .update(vendors)
        .set({ ownerUserId, updatedAt: sql`now()` })
        .where(eq(vendors.id, vendorId))
        .returning();
      if (vendor) {
        await tx
          .update(users)
          .set({ role: 'vendor', updatedAt: sql`now()` })
          .where(eq(users.id, ownerUserId));
      }
      return vendor;
    });
  }

  async update(
    id: number,
    patch: Partial<CreateVendorInput>,
  ): Promise<Vendor | undefined> {
    const [vendor] = await this.db
      .update(vendors)
      .set({ ...patch, updatedAt: sql`now()` })
      .where(eq(vendors.id, id))
      .returning();
    return vendor;
  }

  async setStatus(
    id: number,
    status: VendorStatus,
  ): Promise<Vendor | undefined> {
    const [vendor] = await this.db
      .update(vendors)
      .set({ status, updatedAt: sql`now()` })
      .where(eq(vendors.id, id))
      .returning();
    return vendor;
  }
}
