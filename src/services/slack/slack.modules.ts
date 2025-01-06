import { forwardRef, Module } from '@nestjs/common';
import { PrismaModule } from '../../providers/prisma/prisma.module';
import { AuthModule } from '../../modules/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { WorkflowsModule } from '../../modules/workflows/workflows.module';
import { SlackServices } from './slack.services';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    ConfigModule,
    forwardRef(() => WorkflowsModule),
  ],
  providers: [SlackServices],
  exports: [SlackServices],
})
export class SlackModules {}
