import { Controller, Post, Body } from '@nestjs/common';
import { TelegramService } from './telegram.service';

@Controller('telegram')
export class TelegramController {
  constructor(private readonly telegramService: TelegramService) {}

  /**
   * Endpoint to generate and return a verification code for a user's Telegram account.
   * The code is sent in the HTTP response, and the user enters it in Telegram.
   */
  @Post('verify')
  async generateVerificationCode(@Body() body: { userId: number }) {
    const { userId } = body;

    if (!userId) {
      return {
        success: false,
        message: 'userId is required',
      };
    }

    try {
      // Generate a verification code
      const verificationCode =
        await this.telegramService.generateVerificationCode(userId);

      return {
        success: true,
        message:
          'Verification code generated. Enter this code in the Telegram bot to verify your account.',
        verificationCode,
      };
    } catch (error) {
      console.error('Error generating verification code', error);

      return {
        success: false,
        message: 'Failed to generate the verification code. Please try again.',
      };
    }
  }
}
