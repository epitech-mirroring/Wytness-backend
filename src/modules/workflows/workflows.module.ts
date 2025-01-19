import { forwardRef, Module } from '@nestjs/common';
import { WorkflowsService } from './workflows.service';
import { AuthModule } from '../auth/auth.module';
import { ServicesModule } from '../services/services.module';
import { WorkflowsController } from './workflows.controller';
import { PermissionsModule } from '../permissions/permissions.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Workflow,
  WorkflowExecution,
  WorkflowExecutionTrace,
  WorkflowNode,
  WorkflowNodeNext,
} from '../../types/workflow';
import { NodesService } from './nodes.service';
import { ExecutionsService } from './executions.service';

@Module({
  imports: [
    AuthModule,
    forwardRef(() => ServicesModule),
    PermissionsModule,
    TypeOrmModule.forFeature([
      Workflow,
      WorkflowNode,
      WorkflowNodeNext,
      WorkflowExecution,
      WorkflowExecutionTrace,
    ]),
  ],
  providers: [WorkflowsService, NodesService, ExecutionsService],
  controllers: [WorkflowsController],
  exports: [WorkflowsService, NodesService, ExecutionsService],
})
export class WorkflowsModule {}
