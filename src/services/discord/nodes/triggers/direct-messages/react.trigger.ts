import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { DiscordMessageCreatedEvent } from '../../../discord.type';
import { Trigger } from '../../../../../types/services';
import { WorkflowsService } from '../../../../../modules/workflows/workflows.service';

@Injectable()
export class DirectMessageReactTrigger extends Trigger {
  constructor() {
    super(
      'Direct Message React Trigger',
      'Triggered when a direct message is reacted to',
    );
  }
  @Inject(forwardRef(() => WorkflowsService))
  public _w: WorkflowsService;

  public trigger(data: DiscordMessageCreatedEvent): any {
    return data;
  }
  public getWorkflowService(): WorkflowsService {
    return this._w;
  }
}
