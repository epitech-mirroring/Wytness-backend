import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { DiscordSnowflake } from '../../../discord.type';
import { ConfigService } from '@nestjs/config';
import { Action } from '../../../../../types/services';
import { WorkflowsService } from '../../../../../modules/workflows/workflows.service';
import { WorkflowExecutionTrace } from '../../../../../types/workflow';

@Injectable()
export class DirectMessageSendAction extends Action {
  @Inject()
  private readonly _configService: ConfigService;

  @Inject(forwardRef(() => WorkflowsService))
  public _w: WorkflowsService;

  constructor() {
    super('Direct Message Send Action', 'Send a direct message to a user');
  }

  async execute(
    _outputLabel: string,
    data: {
      channel_id: DiscordSnowflake;
      content: string;
    },
    _config: any,
    trace: WorkflowExecutionTrace,
  ): Promise<void> {
    await this.fetch(
      trace,
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

  public getWorkflowService(): WorkflowsService {
    return this._w;
  }
}
