import { Inject, Injectable } from '@nestjs/common';
import { Action } from '../../../../../types';
import { DiscordSnowflake } from '../../../discord.type';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DirectMessageSendAction extends Action {
  @Inject()
  private readonly _configService: ConfigService;

  constructor() {
    super('Direct Message Send Action', 'Send a direct message to a user');
  }

  async execute(data: {
    channel_id: DiscordSnowflake;
    content: string;
  }): Promise<void> {
    await fetch(
      `https://discord.com/api/v9/channels/${data.channel_id}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bot ${this._configService.get<string>('DISCORD_BOT_TOKEN')}`,
        },
        body: JSON.stringify({ content: data.content }),
      },
    );
  }
}
