import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Action, Field, FieldType } from '../../../../../types/services';
import { WorkflowsService } from '../../../../../modules/workflows/workflows.service';
import { WorkflowExecutionTrace } from '../../../../../types/workflow';
import { AirtableService } from '../../../airtable.service';
import { ExecutionsService } from '../../../../../modules/workflows/executions.service';

@Injectable()
export class GetBaseSchemaAction extends Action {
  @Inject()
  private readonly _configService: ConfigService;

  @Inject(forwardRef(() => WorkflowsService))
  public _w: WorkflowsService;

  @Inject(forwardRef(() => ExecutionsService))
  public _executions: ExecutionsService;

  constructor() {
    super(
      'Get base schema',
      'Get the schema of the tables in the specified base.',
      ['output'],
      [
        new Field(
          'Base ID',
          'base_id',
          'The ID of the base to get the schema for',
          FieldType.STRING,
          false,
        ),
      ],
    );
  }

  async execute(
    _outputLabel: string,
    config: any,
    trace: WorkflowExecutionTrace,
  ): Promise<void> {
    const baseId = trace.processPipelineString(trace.config.base_id);
    const service = this.getService() as AirtableService;
    const user = config.user;

    const res = await service.fetchWithOAuth(
      user,
      trace,
      `https://api.airtable.com/v0/meta/bases/${baseId}/tables`,
    );

    return await res.json();
  }

  public getWorkflowService(): WorkflowsService {
    return this._w;
  }

  public getExecutionService(): ExecutionsService {
    return this._executions;
  }
}
