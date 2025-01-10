import {forwardRef, Inject, Injectable} from '@nestjs/common';
import { DiscordSnowflake } from '../../../discord.type';
import { ConfigService } from '@nestjs/config';
import { Action } from '../../../../../types/services';
import {WorkflowsService} from "../../../../../modules/workflows/workflows.service";


@Injectable()
export class GuildMessageReactAction extends Action {
  @Inject()
  private readonly _configService: ConfigService;

  constructor() {
    super('Guild Message React Action', 'React to a guild message');
  }
  @Inject(forwardRef(() => WorkflowsService))
  public _w: WorkflowsService;

  async execute(data: {
    channel_id: DiscordSnowflake;
    message_id: DiscordSnowflake;
    emoji: string;
  }): Promise<void> {
    await fetch(
      `https://discord.com/api/v9/channels/${data.channel_id}/messages/${data.message_id}/reactions/${encodeURIComponent(data.emoji)}/@me`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bot ${this._configService.get<string>('DISCORD_BOT_TOKEN')}`,
        },
      },
    );
  }
  public getWorkflowService(): WorkflowsService {
    return this._w;
  }
}
