import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { BotModule } from './bot/bot.module';
import { DbModule } from './db/db.module';
import { UsersModule } from './users/users.module';
import { VendorsModule } from './vendors/vendors.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DbModule,
    UsersModule,
    VendorsModule,
    BotModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
