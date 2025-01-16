import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Action, Field, FieldType } from '../../../../../types/services';
import { WorkflowsService } from '../../../../../modules/workflows/workflows.service';
import { WorkflowExecutionTrace } from '../../../../../types/workflow';
import { AirtableService } from '../../../airtable.service';

@Injectable()
export class GetOneRecordAction extends Action {
  @Inject()
  private readonly _configService: ConfigService;

  @Inject(forwardRef(() => WorkflowsService))
  public _w: WorkflowsService;

  constructor() {
    super(
      'Get One Record',
      'Retrieve a single record from a table',
      ['output'],
      [
        new Field(
          'Base ID',
          'base_id',
          'The ID of the base to list records from',
          FieldType.STRING,
          false,
        ),
        new Field(
          'Table ID or Name',
          'table_id',
          'The ID or name of the table to list records from',
          FieldType.STRING,
          false,
        ),
        new Field(
          'Record ID',
          'record_id',
          'The ID of the record to retrieve',
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
    );

    return await res.json();
  }

  public getWorkflowService(): WorkflowsService {
    return this._w;
  }
}
