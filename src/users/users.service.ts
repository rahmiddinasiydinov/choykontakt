import { Inject, Injectable } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import { DRIZZLE } from '../db/db.module';
import type { Database } from '../db/db.module';
import { User, UserRole, users } from '../db/schema';

export interface TelegramProfile {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  language_code?: string;
}

@Injectable()
export class UsersService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  /** Insert on first contact, refresh profile fields on every later contact. */
  async upsertFromTelegram(profile: TelegramProfile): Promise<User> {
    const [user] = await this.db
      .insert(users)
      .values({
        telegramId: profile.id,
        username: profile.username ?? null,
        firstName: profile.first_name ?? null,
        lastName: profile.last_name ?? null,
        languageCode: profile.language_code ?? null,
      })
      .onConflictDoUpdate({
        target: users.telegramId,
        set: {
          username: sql`excluded.username`,
          firstName: sql`excluded.first_name`,
          lastName: sql`excluded.last_name`,
          languageCode: sql`excluded.language_code`,
          updatedAt: sql`now()`,
        },
      })
      .returning();
    return user;
  }

  async findAll(): Promise<User[]> {
    return this.db.query.users.findMany({ orderBy: users.id });
  }

  async findByTelegramId(telegramId: number): Promise<User | undefined> {
    return this.db.query.users.findFirst({
      where: eq(users.telegramId, telegramId),
    });
  }

  async findById(id: number): Promise<User | undefined> {
    return this.db.query.users.findFirst({ where: eq(users.id, id) });
  }

  async setRole(id: number, role: UserRole): Promise<User> {
    const [user] = await this.db
      .update(users)
      .set({ role, updatedAt: sql`now()` })
      .where(eq(users.id, id))
      .returning();
    return user;
  }
}
