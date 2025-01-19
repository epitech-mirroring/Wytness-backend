import { Injectable, Inject } from '@nestjs/common';
import { Service } from '../../types/services';
import { ConfigService } from '@nestjs/config';
import { GetStops } from './node/action/get.stops';
import { GetSchedule } from './node/action/get.schedule';

@Injectable()
export class TanService extends Service {
  @Inject()
  private readonly _configService: ConfigService;

  constructor(
    private readonly _getStops: GetStops,
    private readonly _getSchedule: GetSchedule,
  ) {
    super(
      'naolib',
      'Interact with the Nantes public transport information',
      [_getStops, _getSchedule],
      {
        color: '#78d700',
        useCron: false,
        useAuth: undefined,
        useWebhooks: false,
      },
    );
  }
}
