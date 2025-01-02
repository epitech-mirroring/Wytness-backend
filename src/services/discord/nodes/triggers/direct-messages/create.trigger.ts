import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { DiscordMessageCreatedEvent } from '../../../discord.type';
import { Trigger } from '../../../../../types/services';
import { WorkflowsService } from '../../../../../modules/workflows/workflows.service';

@Injectable()
export class DirectMessageCreatedTrigger extends Trigger {
  @Inject(forwardRef(() => WorkflowsService))
  public _w: WorkflowsService;

  constructor() {
    super(
      'Direct Message Received Trigger',
      'Triggered when a direct message is received',
    );
  }

  public trigger(data: DiscordMessageCreatedEvent): any {
    return data;
  }

  public getWorkflowService(): WorkflowsService {
    return this._w;
  }
}
