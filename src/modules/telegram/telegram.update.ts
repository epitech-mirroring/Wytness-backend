import { Inject, Injectable } from '@nestjs/common';
import { Start, Update, Command } from 'nestjs-telegraf';
import { TelegramService } from './telegram.service';
import { PrismaService } from '../../providers/prisma/prisma.service';

@Injectable()
@Update()
export class TelegramUpdate {
  @Inject()
  readonly prisma: PrismaService;
  constructor(private readonly telegramService: TelegramService) {}

  @Start()
  async onStart(ctx: { update: { message: { chat: { id: any } } } }) {
    const chatId = ctx.update.message.chat.id;

    await this.telegramService.sendMessage(
      chatId,
      'Welcome to the Telegram bot! To verify your account, send /verify {code}.',
    );
  }

  @Command('verify')
  async onVerify(ctx: {
    update: { message: { chat: { id: any }; text: any } };
  }) {
    const chatId = ctx.update.message.chat.id;
    const messageText = ctx.update.message.text;

    // Extract the code from the message
    const codeMatch = messageText.match(/^\/verify\s+(\S+)/);

    if (!codeMatch || codeMatch.length < 2) {
      await this.telegramService.sendMessage(
        chatId,
        'Invalid format. Use /verify {code}.',
      );
      return;
    }

    const verificationCode = codeMatch[1];

    try {
      const codeRecord = await this.prisma.serviceVerificationCode.findUnique({
        where: {
          code_serviceId: {
            code: verificationCode,
            serviceId: this.telegramService.serviceId,
          },
        },
        include: { user: true, service: true },
      });

      if (!codeRecord || codeRecord.service.name !== 'telegram') {
        await this.telegramService.sendMessage(
          chatId,
          'Invalid or expired verification code. Please request a new code.',
        );
        return;
      }

      // Link the Telegram account to the user
      await this.telegramService.linkTelegram(chatId, codeRecord.userId);

      // Clean up the used verification code
      await this.prisma.serviceVerificationCode.delete({
        where: { id: codeRecord.id },
      });

      await this.telegramService.sendMessage(
        chatId,
        'Your account has been successfully verified and linked.',
      );
    } catch (error) {
      console.error('Error during verification', error);
      await this.telegramService.sendMessage(
        chatId,
        'An error occurred during verification. Please try again.',
      );
    }
  }
}
