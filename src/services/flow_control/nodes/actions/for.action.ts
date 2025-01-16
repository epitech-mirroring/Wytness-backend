import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Action,
  Field,
  FieldType,
  MinimalConfig,
} from '../../../../types/services';
import { WorkflowsService } from '../../../../modules/workflows/workflows.service';
import {
  WorkflowExecution,
  WorkflowExecutionStatus,
  WorkflowExecutionTrace,
} from '../../../../types/workflow';

@Injectable()
export class ForAction extends Action {
  @Inject()
  private readonly _configService: ConfigService;

  @Inject(forwardRef(() => WorkflowsService))
  public _w: WorkflowsService;

  constructor() {
    super(
      'For',
      'Iterate over a list of items',
      ['output'],
      [
        new Field(
          'List',
          'list',
          'The list of items to iterate over',
          FieldType.STRING,
          false,
        ),
      ],
    );
  }

  public async _run(
    _label: string,
    data: any,
    config: MinimalConfig & any,
    workflowExecution: WorkflowExecution,
    parentTraceUUID: string | null,
  ): Promise<void> {
    if (workflowExecution.status !== WorkflowExecutionStatus.RUNNING) {
      return;
    }
    const trace = new WorkflowExecutionTrace(this, config);
    trace.input = data || {};
    workflowExecution.addOldData(trace, parentTraceUUID);
    const list = trace.processPipelineString(trace.config.list);
    const jsonList = JSON.parse(list);
    if (!Array.isArray(jsonList)) {
      this.error(trace, 'The list provided is not an array');
      return null;
    }
    workflowExecution.statistics.nodesExecuted++;
    const uuid = workflowExecution.addTrace(trace, parentTraceUUID);
    for (let i = 0; i < jsonList.length; i++) {
      for (const next of config._next['output']) {
        if (workflowExecution.status !== WorkflowExecutionStatus.RUNNING) {
          return;
        }
        trace.output = jsonList[i];
        trace.setCurrentData(jsonList[i]);
        await this.getWorkflowService().runNode(
          next,
          jsonList[i],
          workflowExecution,
          uuid,
        );
      }
    }
    trace.statistics.duration.end = new Date();
  }

  async execute(
    _output: string,
    config: any,
    trace: WorkflowExecutionTrace,
  ): Promise<boolean | null> {
    void config;
    void trace;
    return null;
  }

  getWorkflowService(): WorkflowsService {
    return this._w;
  }
}
