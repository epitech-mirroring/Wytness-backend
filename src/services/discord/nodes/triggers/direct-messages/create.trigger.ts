import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { DiscordMessageCreatedEvent } from '../../../discord.type';
import { Trigger } from '../../../../../types/services';
import { WorkflowsService } from '../../../../../modules/workflows/workflows.service';
import { Field, FieldType } from '../../../../../types/services/field.type';

@Injectable()
export class DirectMessageCreatedTrigger extends Trigger {
  @Inject(forwardRef(() => WorkflowsService))
  public _w: WorkflowsService;

  constructor() {
    super(
      'Direct Message Received Trigger',
      'Triggered when a direct message is received',
      [
        new Field(
          "Channel ID",
          "channelId",
          "The ID of the channel where the message was sent",
          FieldType.STRING,
          false
        ),
      ],
    );
  }

  public trigger(data: DiscordMessageCreatedEvent): any {
    return data;
  }

  public getWorkflowService(): WorkflowsService {
    return this._w;
  }
}
