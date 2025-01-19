import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { Action } from '../../../../../types/services';
import { ServiceWithOAuth } from '../../../../../types/services';
import { WorkflowsService } from '../../../../../modules/workflows/workflows.service';
import { WorkflowExecutionTrace } from '../../../../../types/workflow';
import { ExecutionsService } from '../../../../../modules/workflows/executions.service';

@Injectable()
export class PausePlaybackAction extends Action {
  @Inject(forwardRef(() => WorkflowsService))
  private _w: WorkflowsService;

  @Inject(forwardRef(() => ExecutionsService))
  public _executions: ExecutionsService;

  constructor() {
    super('Pause Playback', 'Pause the playback of the user');
  }

  async execute(
    _label: string,
    config: any,
    trace: WorkflowExecutionTrace,
  ): Promise<void> {
    const user = config.user;
    const service = this.getService();
    if (!service) {
      throw new Error('Service not found');
    }
    await (service as ServiceWithOAuth).fetchWithOAuth(
      user,
      trace,
      'https://api.spotify.com/v1/me/player/pause',
      {
        method: 'PUT',
      },
    );
    return null;
  }

  public getWorkflowService(): WorkflowsService {
    return this._w;
  }

  public getExecutionService(): ExecutionsService {
    return this._executions;
  }
}
