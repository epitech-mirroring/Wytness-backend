import { forwardRef, Module } from '@nestjs/common';
import { WorkflowsService } from './workflows.service';
import { AuthModule } from '../auth/auth.module';
import { ServicesModule } from '../services/services.module';
import { UsersModule } from '../users/users.module';
import { WorkflowsController } from './workflows.controller';
import {
  workflowExecutionProviders,
  workflowExecutionTraceProviders,
  workflowNodeNextProviders,
  workflowNodeProviders,
  workflowProviders,
} from '../../providers/database/providers/workflow.providers';
import { DatabaseModule } from '../../providers/database/database.module';
import { PermissionsModule } from '../permissions/permissions.module';

@Module({
  imports: [
    AuthModule,
    forwardRef(() => ServicesModule),
    UsersModule,
    DatabaseModule,
    PermissionsModule,
  ],
  providers: [
    WorkflowsService,
    ...workflowNodeProviders,
    ...workflowProviders,
    ...workflowExecutionProviders,
    ...workflowExecutionTraceProviders,
    ...workflowNodeNextProviders,
  ],
  controllers: [WorkflowsController],
  exports: [WorkflowsService],
})
export class WorkflowsModule {}
