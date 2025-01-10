import { forwardRef, Module } from '@nestjs/common';
import { DiscordService } from './discord.service';
import { AuthModule } from '../../modules/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { DirectMessageCreatedTrigger } from './nodes/triggers/direct-messages/create.trigger';
import { DirectMessageSendAction } from './nodes/actions/direct-messages/send.action';
import { DirectMessageReactAction } from './nodes/actions/direct-messages/react.action';
import { WorkflowsModule } from '../../modules/workflows/workflows.module';
import {
  serviceNodeProviders,
  serviceProviders,
  serviceUserProviders,
} from '../../providers/database/providers/service.providers';
import { DatabaseModule } from '../../providers/database/database.module';

@Module({
  imports: [
    AuthModule,
    ConfigModule,
    forwardRef(() => WorkflowsModule),
    DatabaseModule,
  ],
  providers: [
    DiscordService,
    DirectMessageCreatedTrigger,
    DirectMessageSendAction,
    DirectMessageReactAction,
    ...serviceProviders,
    ...serviceNodeProviders,
    ...serviceUserProviders,
  ],
  exports: [
    DiscordService,
    DirectMessageCreatedTrigger,
    DirectMessageSendAction,
    DirectMessageReactAction,
  ],
})
export class DiscordModule {}
