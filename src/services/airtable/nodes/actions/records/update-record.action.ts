import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Action, Field, FieldType } from '../../../../../types/services';
import { WorkflowsService } from '../../../../../modules/workflows/workflows.service';
import { WorkflowExecutionTrace } from '../../../../../types/workflow';
import { AirtableService } from '../../../airtable.service';

@Injectable()
export class UpdateRecordAction extends Action {
  @Inject()
  private readonly _configService: ConfigService;

  @Inject(forwardRef(() => WorkflowsService))
  public _w: WorkflowsService;

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
          'The ID of the record to update',
          FieldType.STRING,
          false,
        ),
        new Field(
          'Data',
          'data',
          'The data to update the record with',
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
    const data = trace.processPipelineString(trace.config.data);
    const service = this.getService() as AirtableService;
    const user = config.user;

    let dataObj: any;
    try {
      dataObj = JSON.parse(data);
    } catch (e) {
      void e;
      this.error(trace, 'Data must be a valid JSON object');
      return null;
    }

    const res = await service.fetchWithOAuth(
      user,
      trace,
      `https://api.airtable.com/v0/${baseId}/${tableId}/${recordId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataObj),
      },
    );

    return await res.json();
  }

  public getWorkflowService(): WorkflowsService {
    return this._w;
  }
}
