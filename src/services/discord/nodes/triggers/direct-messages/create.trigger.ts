import { Injectable } from '@nestjs/common';
import { DiscordMessageCreatedEvent } from '../../../discord.type';
import { Trigger } from '../../../../../types/services';

@Injectable()
export class DirectMessageCreatedTrigger extends Trigger {
  constructor() {
    super(
      'Direct Message Received Trigger',
      'Triggered when a direct message is received',
    );
  }

  public trigger(data: DiscordMessageCreatedEvent): any {
    return data;
  }
}
