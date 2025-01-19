import { forwardRef, Module } from '@nestjs/common';
import { DiscordService } from './discord.service';
import { AuthModule } from '../../modules/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { DirectMessageCreatedTrigger } from './nodes/triggers/direct-messages/create.trigger';
import { DirectMessageSendAction } from './nodes/actions/direct-messages/send.action';
import { DirectMessageReactAction } from './nodes/actions/direct-messages/react.action';
import { WorkflowsModule } from '../../modules/workflows/workflows.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Node, Service, ServiceUser } from '../../types/services';
import { User } from '../../types/user';

@Module({
  imports: [
    AuthModule,
    ConfigModule,
    forwardRef(() => WorkflowsModule),
    TypeOrmModule.forFeature([Service, Node, User, ServiceUser]),
  ],
  providers: [
    DiscordService,
    DirectMessageCreatedTrigger,
    DirectMessageSendAction,
    DirectMessageReactAction,
  ],
  exports: [
    DiscordService,
    DirectMessageCreatedTrigger,
    DirectMessageSendAction,
    DirectMessageReactAction,
  ],
})
export class DiscordModule {}
