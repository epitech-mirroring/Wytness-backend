import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { DiscordSnowflake } from '../../../discord.type';
import { ConfigService } from '@nestjs/config';
import { Action } from '../../../../../types/services';
import { WorkflowsService } from '../../../../../modules/workflows/workflows.service';

@Injectable()
export class DirectMessageDeleteAction extends Action {
  @Inject()
  private readonly _configService: ConfigService;

  constructor() {
    super('Direct Message Delete Action', 'Delete a direct message');
  }
  @Inject(forwardRef(() => WorkflowsService))
  public _w: WorkflowsService;

  async execute(
    data: {
      channel_id: DiscordSnowflake;
      message_id: DiscordSnowflake;
    },
    config: any,
  ): Promise<void> {
    console.log('Deleting message');
    console.log(config);
    await fetch(
      `https://discord.com/api/v9/channels/${data.channel_id}/messages/${data.message_id}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bot ${this._configService.get<string>('DISCORD_BOT_TOKEN')}`,
        },
      },
    );
  }
  getWorkflowService(): any {
    return this._w;
  }
}
