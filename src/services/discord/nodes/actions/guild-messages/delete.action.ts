import {forwardRef, Inject, Injectable} from '@nestjs/common';
import { DiscordSnowflake } from '../../../discord.type';
import { ConfigService } from '@nestjs/config';
import { Action } from '../../../../../types/services';
import {WorkflowsService} from "../../../../../modules/workflows/workflows.service";

@Injectable()
export class DirectMessageDeleteAction extends Action {
  constructor(
    @Inject(ConfigService) private readonly configService: ConfigService,
  ) {
    super('Guild Message Delete Action', 'Delete a guild message');
  }

  @Inject(forwardRef(() => WorkflowsService))
  public _w: WorkflowsService;

  async execute(data: {
    channel_id: DiscordSnowflake;
    message_id: DiscordSnowflake;
  }): Promise<void> {
    await fetch(
      `https://discord.com/api/v9/channels/${data.channel_id}/messages/${data.message_id}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bot ${this.configService.get<string>('DISCORD_BOT_TOKEN')}`,
        },
      },
    );
  }
  public getWorkflowService(): WorkflowsService {
    return this._w;
  }
}
