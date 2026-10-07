import { Context } from 'telegraf';
import { User } from '../db/schema';

export interface BotContext extends Context {
  state: Context['state'] & { user: User };
}
