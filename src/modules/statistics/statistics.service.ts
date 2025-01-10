import { Inject, Injectable } from '@nestjs/common';
import { WorkflowsService } from '../workflows/workflows.service';

@Injectable()
export class StatisticsService {
  @Inject()
  private readonly _workflows: WorkflowsService;
}
