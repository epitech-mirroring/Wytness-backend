import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { DiscordSnowflake } from '../../../discord.type';
import { ConfigService } from '@nestjs/config';
import { Action, Field, FieldType } from '../../../../../types/services';
import { WorkflowsService } from '../../../../../modules/workflows/workflows.service';
import { WorkflowExecutionTrace } from '../../../../../types/workflow';

@Injectable()
export class DirectMessageSendAction extends Action {
  @Inject()
  private readonly _configService: ConfigService;

  @Inject(forwardRef(() => WorkflowsService))
  public _w: WorkflowsService;

  constructor() {
    super(
      'Direct Message Send Action',
      'Send a direct message to a user',
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
          'Content',
          'content',
          'The content of the message',
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
    const channelID = trace.processStringWithVariables(trace.config.channel_id);
    const content = trace.processStringWithVariables(trace.config.content);

    await this.fetch(
      trace,
      `https://discord.com/api/v9/channels/${channelID}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bot ${this._configService.get<string>('DISCORD_BOT_TOKEN')}`,
        },
        body: JSON.stringify({ content: content }),
      },
    );
  }

  public getWorkflowService(): WorkflowsService {
    return this._w;
  }
}
