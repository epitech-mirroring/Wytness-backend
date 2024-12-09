import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import { OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../providers/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { NotFoundError } from 'rxjs';

@Injectable()
export class TelegramService implements OnModuleInit {
  constructor(
    @InjectBot()
    private readonly bot: Telegraf,
    private readonly prisma: PrismaService,
  ) {}

  serviceId: number;

  async onModuleInit() {
    const exist =
      (await this.prisma.service.count({ where: { name: 'telegram' } })) > 0;
    if (!exist) {
      await this.prisma.service.create({
        data: {
          name: 'telegram',
          description: 'Telegram service',
        },
      });
    }
    const serviceId = await this.prisma.service.findUnique({
      where: { name: 'telegram' },
      select: { id: true },
    });
    this.serviceId = serviceId.id;
  }

  async sendMessage(chatId: string, message: string) {
    try {
      await this.bot.telegram.sendMessage(chatId, message);
      console.log(`Message sent to chat ID ${chatId}`);
    } catch (error) {
      console.error('Error sending message', error);
    }
  }

  async generateVerificationCode(AppUserId: number): Promise<string> {
    if (!AppUserId) {
      throw new NotFoundException('User not found');
    }
    const verificationCode = Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();
    await this.prisma.serviceVerificationCode.create({
      data: {
        user: { connect: { id: AppUserId } },
        service: { connect: { name: 'telegram' } },
        code: verificationCode,
      },
    });
    return verificationCode;
  }

  async sendVerificationCode(userId: number) {
    const generatedCode = await this.generateVerificationCode(userId);

    if (!generatedCode) {
      throw new NotFoundException('Failed to generate verification code');
    }
    return generatedCode;
  }

  async linkTelegram(chatId: string, userId: number) {
    try {
      const existingLink = await this.prisma.serviceUser.findUnique({
        where: { serviceId_userId: { serviceId: this.serviceId, userId } },
      });

      if (existingLink) {
        throw new Error('Telegram account is already linked.');
      }
      const json = { chatId } as Prisma.JsonObject;
      await this.prisma.serviceUser.create({
        data: {
          service: { connect: { name: 'telegram' } },
          user: { connect: { id: userId } },
          dataJson: json,
        },
      });

      await this.sendMessage(
        chatId,
        'Your account has been successfully linked.',
      );
    } catch (error) {
      console.error('Error linking Telegram', error);
      await this.sendMessage(
        chatId,
        'Failed to link your account. Please try again.',
      );
    }
  }
}
