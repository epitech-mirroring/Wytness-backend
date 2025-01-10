import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { DiscordSnowflake } from '../../../discord.type';
import { ConfigService } from '@nestjs/config';
import { Action } from '../../../../../types/services';
import { WorkflowsService } from '../../../../../modules/workflows/workflows.service';

@Injectable()
export class GuildMessageSendAction extends Action {
  @Inject()
  private readonly _configService: ConfigService;

  constructor() {
    super('Guild Message Send Action', 'Send a message to guild');
  }
  @Inject(forwardRef(() => WorkflowsService))
  public _w: WorkflowsService;

  async execute(data: {
    channel_id: DiscordSnowflake;
    content: string;
  }): Promise<void> {
    const channelResponse = await fetch(
      `https://discord.com/api/v9/channels/${data.channel_id}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bot ${this._configService.get<string>('DISCORD_BOT_TOKEN')}`,
        },
      },
    );

    const channelData = await channelResponse.json();
    if (channelData.type !== 0) {
      throw new Error('Channel is not a guild channel');
    }
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
  public getWorkflowService(): any {
    return this._w;
  }
}
