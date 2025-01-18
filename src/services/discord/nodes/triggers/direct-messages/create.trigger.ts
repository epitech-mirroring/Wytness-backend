import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { DiscordMessageCreatedEvent } from '../../../discord.type';
import { Trigger } from '../../../../../types/services';
import { WorkflowsService } from '../../../../../modules/workflows/workflows.service';
import { Field, FieldType } from '../../../../../types/services/field.type';
import { WorkflowExecutionTrace } from '../../../../../types/workflow';
import { User } from '../../../../../types/user';
import { ExecutionsService } from '../../../../../modules/workflows/executions.service';

@Injectable()
export class DirectMessageCreatedTrigger extends Trigger {
  @Inject(forwardRef(() => WorkflowsService))
  public _w: WorkflowsService;

  @Inject(forwardRef(() => ExecutionsService))
  public _executions: ExecutionsService;

  constructor() {
    super(
      'Direct Message Received Trigger',
      'Triggered when a direct message is received',
      ['output'],
      [
        new Field(
          'Channel ID',
          'channelId',
          'The ID of the channel where the message was sent',
          FieldType.STRING,
          false,
        ),
      ],
    );
  }

  async isTriggered(
    _label: string,
    user: User,
    config: { channelId: string },
    data: DiscordMessageCreatedEvent,
  ): Promise<boolean> {
    void user;
    return data.channel_id === config.channelId;
  }

  public trigger(
    _outputLabel: string,
    data: DiscordMessageCreatedEvent,
    _config: { channelId: string },
    trace: WorkflowExecutionTrace,
  ): any {
    trace.statistics.dataUsed.download += JSON.stringify(data).length;
    return data;
  }

  public getWorkflowService(): WorkflowsService {
    return this._w;
  }

  public getExecutionService(): ExecutionsService {
    return this._executions;
  }
}
