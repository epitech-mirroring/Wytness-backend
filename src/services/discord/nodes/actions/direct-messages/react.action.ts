import { Inject, Injectable } from '@nestjs/common';
import { DiscordSnowflake } from '../../../discord.type';
import { ConfigService } from '@nestjs/config';
import { Action } from '../../../../../types/services';


@Injectable()
export class DirectMessageReactAction extends Action {
  @Inject()
  private readonly _configService: ConfigService;

  constructor() {
    super('Direct Message React Action', 'React to a direct message');
  }

  async execute(data: {
    channel_id: DiscordSnowflake;
    id: DiscordSnowflake;
  }): Promise<void> {
    console.log('Reacting to message');
    console.log(data);
    console.log(await fetch(
      `https://discord.com/api/v9/channels/${data.channel_id}/messages/${data.id}/reactions/${encodeURIComponent("👌")}/@me`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bot ${this._configService.get<string>('DISCORD_BOT_TOKEN')}`,
        },
      },
    ));
  }
}
