import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { Action } from 'src/types/services/action.type';
import { ServiceWithOAuth } from 'src/types/services/service.type';
import { WorkflowsService } from '../../../../../modules/workflows/workflows.service';
import { WorkflowExecutionTrace } from '../../../../../types/workflow';

@Injectable()
export class PausePlaybackAction extends Action {
  @Inject(forwardRef(() => WorkflowsService))
  private _w: WorkflowsService;

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
}
