import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from '../../modules/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { WorkflowsModule } from '../../modules/workflows/workflows.module';
import { DatabaseModule } from '../../providers/database/database.module';
import {
  serviceNodeProviders,
  serviceProviders,
  serviceUserProviders,
} from '../../providers/database/providers/service.providers';
import { IfAction } from './nodes/actions/if.action';
import { FlowControlService } from './flow-control.service';
import { ForAction } from './nodes/actions/for.action';

@Module({
  imports: [
    AuthModule,
    ConfigModule,
    forwardRef(() => WorkflowsModule),
    DatabaseModule,
  ],
  providers: [
    IfAction,
    ForAction,
    FlowControlService,
    ...serviceProviders,
    ...serviceUserProviders,
    ...serviceNodeProviders,
  ],
  exports: [IfAction, FlowControlService],
})
export class FlowControlModule {}
