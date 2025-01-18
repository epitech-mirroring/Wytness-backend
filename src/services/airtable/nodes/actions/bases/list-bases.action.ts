import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Action } from '../../../../../types/services';
import { WorkflowsService } from '../../../../../modules/workflows/workflows.service';
import { WorkflowExecutionTrace } from '../../../../../types/workflow';
import { AirtableService } from '../../../airtable.service';
import { ExecutionsService } from '../../../../../modules/workflows/executions.service';

@Injectable()
export class ListBasesAction extends Action {
  @Inject()
  private readonly _configService: ConfigService;

  @Inject(forwardRef(() => WorkflowsService))
  public _w: WorkflowsService;

  @Inject(forwardRef(() => ExecutionsService))
  public _executions: ExecutionsService;

  constructor() {
    super('List Bases', "List all bases in the user's account", ['output']);
  }

  async execute(
    _outputLabel: string,
    config: any,
    trace: WorkflowExecutionTrace,
  ): Promise<void> {
    const service = this.getService() as AirtableService;
    const user = config.user;

    const res = await service.fetchWithOAuth(
      user,
      trace,
      `https://api.airtable.com/v0/meta/bases`,
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
