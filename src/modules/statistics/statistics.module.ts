import { Module } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { WorkflowsModule } from '../workflows/workflows.module';

@Module({
  imports: [WorkflowsModule],
  providers: [StatisticsService],
})
export class StatisticsModule {}
