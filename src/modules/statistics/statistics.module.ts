import { Module } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { WorkflowsModule } from '../workflows/workflows.module';
import { AuthModule } from '../auth/auth.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { StatisticsController } from './statistics.controller';

@Module({
  imports: [WorkflowsModule, AuthModule, PermissionsModule],
  providers: [StatisticsService],
  controllers: [StatisticsController],
})
export class StatisticsModule {}
