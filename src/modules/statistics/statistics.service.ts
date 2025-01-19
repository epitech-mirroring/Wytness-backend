import { Inject, Injectable } from '@nestjs/common';
import { WorkflowsService } from '../workflows/workflows.service';
import { User } from '../../types/user';
import { WorkflowExecutionStatus } from '../../types/workflow';
import { ExecutionsService } from '../workflows/executions.service';

@Injectable()
export class StatisticsService {
  @Inject()
  private readonly _workflows: WorkflowsService;

  @Inject()
  private readonly _executions: ExecutionsService;

  async getStatisticsForWorkflow(workflowId: number, performer: User) {
    const workflow = await this._workflows.getWorkflow(workflowId, performer);
    if (!workflow) {
      return { error: 'Workflow not found' };
    }

    const executions = await this._executions.getExecutions(
      performer,
      workflowId,
    );

    return {
      executions: executions.length,
      successfulExecutions: executions.filter(
        (e) => e.status === WorkflowExecutionStatus.COMPLETED,
      ).length,
      failedExecutions: executions.filter(
        (e) => e.status === WorkflowExecutionStatus.FAILED,
      ).length,
      dataUsedDownLoad: executions.reduce(
        (acc, e) => acc + e.statistics.dataUsed.download,
        0,
      ),
      dataUsedUpload: executions.reduce(
        (acc, e) => acc + e.statistics.dataUsed.upload,
        0,
      ),
      nodesExecuted: executions.reduce(
        (acc, e) => acc + e.statistics.nodesExecuted,
        0,
      ),
    };
  }

  async getGlobalStatistics(performer: User) {
    const workflows = await this._workflows.listWorkflows(performer, {
      timeframe: {
        start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
        end: new Date(),
      },
    });

    const statistics = await Promise.all(
      workflows.map(async (w) => {
        return this.getStatisticsForWorkflow((await w).id, performer);
      }),
    );

    const statisticsFiltered = statistics.filter((s) => !('error' in s));

    return {
      workflows: statisticsFiltered.length,
      executions: statisticsFiltered.reduce((acc, s) => acc + s.executions, 0),
      successfulExecutions: statisticsFiltered.reduce(
        (acc, s) => acc + s.successfulExecutions,
        0,
      ),
      failedExecutions: statisticsFiltered.reduce(
        (acc, s) => acc + s.failedExecutions,
        0,
      ),
      dataUsedDownLoad: statisticsFiltered.reduce(
        (acc, s) => acc + s.dataUsedDownLoad,
        0,
      ),
      dataUsedUpload: statisticsFiltered.reduce(
        (acc, s) => acc + s.dataUsedUpload,
        0,
      ),
      nodesExecuted: statisticsFiltered.reduce(
        (acc, s) => acc + s.nodesExecuted,
        0,
      ),
    };
  }
}
