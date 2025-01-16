import {
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
} from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { AuthContext } from '../auth/auth.context';
import { Private } from '../auth/decorators/private.decorator';

@Controller('statistics')
export class StatisticsController {
  @Inject()
  private readonly _statisticsService: StatisticsService;

  @Inject()
  private readonly _authContext: AuthContext;

  @Private()
  @Get('/workflows/:workflowId')
  public async getWorkflowStatistics(@Param('workflowId') workflowId: string) {
    const result = await this._statisticsService.getStatisticsForWorkflow(
      parseInt(workflowId),
      this._authContext.user,
    );
    if ('error' in result) {
      throw new NotFoundException(result.error);
    }
    return result;
  }

  @Private()
  @Get('/users/me')
  public async getUserStatistics() {
    return this._statisticsService.getGlobalStatistics(this._authContext.user);
  }
}
