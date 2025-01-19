import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Service } from '../../types/services';
import { WorkflowsService } from '../../modules/workflows/workflows.service';
import { ConfigService } from '@nestjs/config';
import { WeatherAction } from './nodes/actions/get.weather';

@Injectable()
export class WeatherService extends Service {
  @Inject()
  private readonly _configService: ConfigService;

  @Inject(forwardRef(() => WorkflowsService))
  private _w: WorkflowsService;

  constructor(private _weatherAction: WeatherAction) {
    super(
      'weather',
      'Integrate Wytness with your weather workspace',
      [_weatherAction],
      {
        color: '#36C5F0',
        useCron: true,
        useAuth: undefined,
        useWebhooks: false,
      },
    );
  }
}
