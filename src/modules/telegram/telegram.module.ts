import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { TelegramService } from './telegram.service';
import { TelegramUpdate } from './telegram.update';
import { TelegramController } from './telegram.controller';
import { PrismaModule } from '../../providers/prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    TelegrafModule.forRoot({
      token: process.env.TELEGRAM_BOT_TOKEN,
    }),
  ],
  providers: [TelegramService, TelegramUpdate],
  controllers: [TelegramController],
  exports: [TelegramService],
})
export class TelegramModule {}
