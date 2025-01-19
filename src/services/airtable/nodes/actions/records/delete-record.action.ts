import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Action, Field, FieldType } from '../../../../../types/services';
import { WorkflowsService } from '../../../../../modules/workflows/workflows.service';
import { WorkflowExecutionTrace } from '../../../../../types/workflow';
import { AirtableService } from '../../../airtable.service';
import { ExecutionsService } from '../../../../../modules/workflows/executions.service';

@Injectable()
export class DeleteRecordAction extends Action {
  @Inject()
  private readonly _configService: ConfigService;

  @Inject(forwardRef(() => WorkflowsService))
  public _w: WorkflowsService;

  @Inject(forwardRef(() => ExecutionsService))
  public _executions: ExecutionsService;

  constructor() {
    super(
      'Update Record',
      'Updates a single record.',
      ['output'],
      [
        new Field(
          'Base ID',
          'base_id',
          'The ID of the base the table is in',
          FieldType.STRING,
          false,
        ),
        new Field(
          'Table ID or Name',
          'table_id',
          'The ID or name of the table where the record is',
          FieldType.STRING,
          false,
        ),
        new Field(
          'Record ID',
          'record_id',
          'The ID of the record to delete',
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
    const tableId = trace.processPipelineString(trace.config.table_id);
    const recordId = trace.processPipelineString(trace.config.record_id);
    const service = this.getService() as AirtableService;
    const user = config.user;

    const res = await service.fetchWithOAuth(
      user,
      trace,
      `https://api.airtable.com/v0/${baseId}/${tableId}/${recordId}`,
      {
        method: 'DELETE',
      },
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
