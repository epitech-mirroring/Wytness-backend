import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Action, Field, FieldType } from '../../../../../types/services';
import { WorkflowsService } from '../../../../../modules/workflows/workflows.service';
import { WorkflowExecutionTrace } from '../../../../../types/workflow';

@Injectable()
export class DirectMessageReactAction extends Action {
  @Inject()
  private readonly _configService: ConfigService;

  @Inject(forwardRef(() => WorkflowsService))
  public _w: WorkflowsService;

  constructor() {
    super(
      'Direct Message React Action',
      'React to a direct message',
      ['output'],
      [
        new Field(
          'Channel ID',
          'channel_id',
          'The ID of the channel to send the message to',
          FieldType.STRING,
          false,
        ),
        new Field(
          'Message ID',
          'id',
          'The ID of the message to react to',
          FieldType.STRING,
          false,
        ),
        new Field(
          'Emoji',
          'emoji',
          'The emoji to react with',
          FieldType.STRING,
          false,
        ),
      ],
    );
  }

  async execute(
    _outputLabel: string,
    _config: any,
    trace: WorkflowExecutionTrace,
  ): Promise<void> {
    const channelID = trace.processPipelineString(trace.config.channel_id);
    const messageID = trace.processPipelineString(trace.config.id);
    const emoji = trace.processPipelineString(trace.config.emoji);

    if (emoji.length !== 1) {
      this.error(trace, 'Emoji must be a single character');
    }

    await this.fetch(
      trace,
      `https://discord.com/api/v9/channels/${channelID}/messages/${messageID}/reactions/${encodeURIComponent(emoji)}/@me`,
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
