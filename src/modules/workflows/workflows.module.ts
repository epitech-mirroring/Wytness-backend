import { forwardRef, Module } from '@nestjs/common';
import { WorkflowsService } from './workflows.service';
import { AuthModule } from '../auth/auth.module';
import { ServicesModule } from '../services/services.module';
import { UsersModule } from '../users/users.module';
import { WorkflowsController } from './workflows.controller';
import {
  workflowExecutionProviders,
  workflowExecutionTraceProviders,
  workflowNodeProviders,
  workflowProviders,
} from '../../providers/database/providers/workflow.providers';
import { DatabaseModule } from '../../providers/database/database.module';

@Module({
  imports: [
    AuthModule,
    forwardRef(() => ServicesModule),
    UsersModule,
    DatabaseModule,
  ],
  providers: [
    WorkflowsService,
    ...workflowNodeProviders,
    ...workflowProviders,
    ...workflowExecutionProviders,
    ...workflowExecutionTraceProviders,
  ],
  controllers: [WorkflowsController],
  exports: [WorkflowsService],
})
export class WorkflowsModule {}
