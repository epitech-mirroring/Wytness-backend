import { Module } from '@nestjs/common';
import { DiscordService } from './discord.service';
import { PrismaModule } from '../../providers/prisma/prisma.module';
import { AuthModule } from '../../modules/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { DirectMessageCreatedTrigger } from './nodes/triggers/direct-messages/create.trigger';
import { DirectMessageSendAction } from './nodes/actions/direct-messages/send.action';
import { WorkflowsModule } from '../../modules/workflows/workflows.module';

@Module({
  imports: [PrismaModule, AuthModule, ConfigModule, WorkflowsModule],
  providers: [
    DiscordService,
    DirectMessageCreatedTrigger,
    DirectMessageSendAction,
  ],
  exports: [DiscordService],
})
export class DiscordModule {}
