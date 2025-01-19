import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Action, Field, FieldType } from '../../../../types/services';
import { WorkflowsService } from '../../../../modules/workflows/workflows.service';
import { WorkflowExecutionTrace } from '../../../../types/workflow';
import { ExecutionsService } from '../../../../modules/workflows/executions.service';

@Injectable()
export class IfAction extends Action {
  @Inject()
  private readonly _configService: ConfigService;

  @Inject(forwardRef(() => WorkflowsService))
  public _w: WorkflowsService;

  @Inject(forwardRef(() => ExecutionsService))
  public _executions: ExecutionsService;

  constructor() {
    super(
      'IF',
      'Check if a condition is true',
      ['true', 'false'],
      [
        new Field(
          'Condition',
          'condition',
          'The condition to check',
          FieldType.STRING,
          false,
        ),
      ],
    );
  }

  async execute(
    outputLabel: string,
    _config: any,
    trace: WorkflowExecutionTrace,
  ): Promise<boolean | null> {
    const condition = trace.processPipelineString(trace.config.condition);
    const result = condition === 'true' || condition === '1';
    const trueOutput = outputLabel === 'true';

    if (result === trueOutput) {
      return true;
    } else {
      return null;
    }
  }

  getWorkflowService(): WorkflowsService {
    return this._w;
  }

  getExecutionService(): ExecutionsService {
    return this._executions;
  }
}
