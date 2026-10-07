import { relations } from 'drizzle-orm';
import {
  doublePrecision,
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { users } from './users';

export const vendorStatusEnum = pgEnum('vendor_status', [
  'pending',
  'active',
  'blocked',
]);

export const vendors = pgTable(
  'vendors',
  {
    id: serial('id').primaryKey(),
    /** Null until a Telegram user claims this choyxona. */
    ownerUserId: integer('owner_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    name: text('name').notNull(),
    city: text('city').notNull(),
    /** E.164 numbers, e.g. +998901234567. */
    phones: text('phones').array().notNull().default([]),
    description: text('description'),
    address: text('address'),
    latitude: doublePrecision('latitude'),
    longitude: doublePrecision('longitude'),
    status: vendorStatusEnum('status').notNull().default('pending'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index('vendors_owner_user_id_idx').on(t.ownerUserId),
    uniqueIndex('vendors_city_name_uniq').on(t.city, t.name),
    index('vendors_phones_gin_idx').using('gin', t.phones),
  ],
);

export const vendorsRelations = relations(vendors, ({ one }) => ({
  owner: one(users, { fields: [vendors.ownerUserId], references: [users.id] }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  vendors: many(vendors),
}));

export type Vendor = typeof vendors.$inferSelect;
export type NewVendor = typeof vendors.$inferInsert;
export type VendorStatus = (typeof vendorStatusEnum.enumValues)[number];
