import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { Action } from 'src/types/services/action.type';
import { ServiceWithOAuth } from 'src/types/services/service.type';
import { WorkflowsService } from '../../../../../modules/workflows/workflows.service';

@Injectable()
export class PausePlaybackAction extends Action {
  @Inject(forwardRef(() => WorkflowsService))
  private _w: WorkflowsService;

  constructor() {
    super('Pause Playback', 'Pause the playback of the user');
  }

  async execute(data: any, config: any): Promise<void> {
    const user = config.user;
    const service = this.getService();
    if (!service) {
      throw new Error('Service not found');
    }
    await (service as ServiceWithOAuth).fetchWithOAuth(
      user,
      'https://api.spotify.com/v1/me/player/pause',
    );
    return null;
  }

  public getWorkflowService(): WorkflowsService {
    return this._w;
  }
}
