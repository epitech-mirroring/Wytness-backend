import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from '../../modules/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { WorkflowsModule } from '../../modules/workflows/workflows.module';
import { IfAction } from './nodes/actions/if.action';
import { FlowControlService } from './flow-control.service';
import { ForAction } from './nodes/actions/for.action';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Node, Service } from '../../types/services';
import { User } from '../../types/user';

@Module({
  imports: [
    AuthModule,
    ConfigModule,
    forwardRef(() => WorkflowsModule),
    TypeOrmModule.forFeature([Service, User, Node]),
  ],
  providers: [IfAction, ForAction, FlowControlService],
  exports: [IfAction, FlowControlService],
})
export class FlowControlModule {}
