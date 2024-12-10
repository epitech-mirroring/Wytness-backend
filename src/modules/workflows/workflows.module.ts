import { Module } from '@nestjs/common';
import { WorkflowsService } from './workflows.service';
import { AuthModule } from '../auth/auth.module';
import { ServicesModule } from '../services/services.module';
import { UsersModule } from '../users/users.module';
import { WorkflowsController } from './workflows.controller';
import { PrismaModule } from '../../providers/prisma/prisma.module';

@Module({
  imports: [PrismaModule, AuthModule, ServicesModule, UsersModule],
  providers: [WorkflowsService],
  controllers: [WorkflowsController],
  exports: [WorkflowsService],
})
export class WorkflowsModule {}
