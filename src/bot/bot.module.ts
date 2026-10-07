import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import { UsersModule } from '../users/users.module';
import { VendorsModule } from '../vendors/vendors.module';
import { BotUpdate } from './bot.update';

@Module({
  imports: [
    TelegrafModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        token: config.getOrThrow<string>('TELEGRAM_BOT_TOKEN'),
        // BOT_DISABLED=true: register handlers but do not poll Telegram
        // (useful for local REST/Swagger work without a real token).
        launchOptions:
          config.get<string>('BOT_DISABLED') === 'true' ? false : undefined,
      }),
    }),
    UsersModule,
    VendorsModule,
  ],
  providers: [BotUpdate],
})
export class BotModule {}
