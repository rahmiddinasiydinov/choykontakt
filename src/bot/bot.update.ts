import {
  Command,
  Ctx,
  Message,
  Next,
  Start,
  Update,
  Use,
} from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { UsersService } from '../users/users.service';
import { VendorsService } from '../vendors/vendors.service';
import type { BotContext } from './bot.context';

@Update()
export class BotUpdate {
  constructor(
    private readonly usersService: UsersService,
    private readonly vendorsService: VendorsService,
  ) {}

  /** Runs on every update: ensures user row exists, attaches it to ctx.state. */
  @Use()
  async attachUser(
    @Ctx() ctx: Context,
    @Next() next: () => Promise<void>,
  ): Promise<void> {
    if (ctx.from && !ctx.from.is_bot) {
      ctx.state.user = await this.usersService.upsertFromTelegram(ctx.from);
    }
    return next();
  }

  @Start()
  async onStart(@Ctx() ctx: BotContext): Promise<void> {
    const { user } = ctx.state;
    const name = user.firstName ?? user.username ?? 'mehmon';
    await ctx.reply(
      `Salom, ${name}! Role: ${user.role}.\nRegister choyxona: /register <name>`,
    );
  }

  @Command('register')
  async onRegister(
    @Ctx() ctx: BotContext,
    @Message('text') text: string,
  ): Promise<void> {
    const name = text.replace(/^\/register(@\w+)?\s*/, '').trim();
    if (!name) {
      await ctx.reply('Usage: /register <choyxona name>');
      return;
    }
    const vendor = await this.vendorsService.create({
      ownerUserId: ctx.state.user.id,
      name,
      city: 'Asaka',
    });
    await ctx.reply(
      `Choyxona "${vendor.name}" created (#${vendor.id}, status: ${vendor.status}).`,
    );
  }

  @Command('me')
  async onMe(@Ctx() ctx: BotContext): Promise<void> {
    const { user } = ctx.state;
    const owned = await this.vendorsService.findByOwner(user.id);
    const list = owned.length
      ? owned.map((v) => `#${v.id} ${v.name} [${v.status}]`).join('\n')
      : 'none';
    await ctx.reply(
      `id: ${user.id}\ntelegram: ${user.telegramId}\nrole: ${user.role}\nchoyxonas:\n${list}`,
    );
  }
}
