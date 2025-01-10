import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { DiscordSnowflake } from '../../../discord.type';
import { ConfigService } from '@nestjs/config';
import { Action } from '../../../../../types/services';
import { WorkflowsService } from '../../../../../modules/workflows/workflows.service';
import { Field, FieldType } from '../../../../../types/services/field.type';

@Injectable()
export class DirectMessageReactAction extends Action {
  @Inject()
  private readonly _configService: ConfigService;

  @Inject(forwardRef(() => WorkflowsService))
  public _w: WorkflowsService;

  constructor() {
    super('Direct Message React Action', 'React to a direct message', [
      new Field(
        'Reaction',
        'reaction',
        'The reaction to add to the message',
        FieldType.STRING,
        false,
      ),
    ]);
  }

  async execute(
    data: {
      channel_id: DiscordSnowflake;
      id: DiscordSnowflake;
    },
    config: any,
  ): Promise<void> {
    await fetch(
      `https://discord.com/api/v9/channels/${data.channel_id}/messages/${data.id}/reactions/${encodeURIComponent(config.reaction)}/@me`,
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
