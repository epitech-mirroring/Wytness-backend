import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Action } from 'src/types/services/action.type';
import { ServiceWithOAuth } from 'src/types/services/service.type';
import { ServicesService } from 'src/modules/services/services.service';

@Injectable()
export class PausePlaybackAction extends Action {
  @Inject()
  private readonly _configService: ConfigService;

  @Inject(forwardRef(() => ServicesService))
  private _servicesService: ServicesService;

  constructor() {
    super('Pause Playback', 'Pause the playback of the user');
  }

  async execute(data: any, config: any): Promise<void> {
    const user = config.user;
    const service = this._servicesService.getServiceByName("Spotify");
    if (!service) {
      throw new Error("Service not found");
    }
    await (service as ServiceWithOAuth).fetchWithOAuth(user, "https://api.spotify.com/v1/me/player/pause");
    return null;
  }
}
