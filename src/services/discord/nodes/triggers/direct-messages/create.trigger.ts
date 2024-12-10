import { Injectable } from '@nestjs/common';
import { Trigger } from '../../../../../types';
import { DiscordMessageCreatedEvent } from '../../../discord.type';

@Injectable()
export class DirectMessageCreatedTrigger extends Trigger {
  constructor() {
    super(
      'Direct Message Received Trigger',
      'Triggered when a direct message is received',
    );
  }

  public trigger(data: DiscordMessageCreatedEvent): any {
    console.log(data.content);
    return data;
  }
}
