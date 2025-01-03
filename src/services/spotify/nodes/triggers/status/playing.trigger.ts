import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { ServiceWithOAuth } from 'src/types/services/service.type';
import { Trigger } from 'src/types/services/trigger.type';
import { User } from 'src/types/user/user.type';
import { WorkflowsService } from '../../../../../modules/workflows/workflows.service';

@Injectable()
export class PlayingMusicTrigger extends Trigger {
  @Inject(forwardRef(() => WorkflowsService))
  private _w: WorkflowsService;

  constructor() {
    super('Playing Music', 'Trigger when the user is playing a music');
  }

  public async trigger(data: any, config: any): Promise<any> {
    const user = config.user;
    const service = this.getService();
    if (!service) {
      throw new Error('Service not found');
    }
    const response = await (service as ServiceWithOAuth).fetchWithOAuth(
      user,
      'https://api.spotify.com/v1/me/player',
    );

    if (response.status === 200) {
      return await response.json();
    }
    return null;
  }

  public async isTriggered(user: User, config: any): Promise<boolean> {
    void config;
    const service = this.getService();
    if (!service) {
      throw new Error('Service not found');
    }
    const response = await (service as ServiceWithOAuth).fetchWithOAuth(
      user,
      'https://api.spotify.com/v1/me/player',
    );

    if (response.status === 200) {
      const data = await response.json();
      return data.is_playing;
    }
    return false;
  }

  public getWorkflowService(): WorkflowsService {
    return this._w;
  }
}
