import {
  Controller,
  Post,
  Body,
  Headers,
  BadRequestException,
} from '@nestjs/common';
import { SlackServices } from './slack.services';

@Controller('slack')
export class SlackController {
  constructor(private readonly slackService: SlackServices) {}

  @Post('events')
  async handleEvent(
    @Body() body: any,
    @Headers('x-slack-signature') signature: string,
    @Headers('x-slack-request-timestamp') timestamp: string,
  ) {
    if (!this.slackService.verifyRequest(signature, timestamp, body)) {
      throw new BadRequestException('Invalid request signature');
    }

    // Handle the event
    await this.slackService.processEvent(body);

    return { status: 'ok' };
  }
}
