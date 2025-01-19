import { Injectable, Inject } from '@nestjs/common';
import { Service } from '../../types/services';
import { ConfigService } from '@nestjs/config';
import { GetAddress } from './node/action/get.address';
import { GetCoordinate } from './node/action/get.coordinate';

@Injectable()
export class GeocodingService extends Service {
  @Inject()
  private readonly _configService: ConfigService;

  constructor(
    private _getAddress: GetAddress,
    private _getCoordinate: GetCoordinate,
  ) {
    super(
      'geocoding',
      'Integrate Wytness with Geoapify geocoding services',
      [_getAddress, _getCoordinate],
      {
        color: '#34a853',
        useCron: false,
        useAuth: undefined,
        useWebhooks: false,
      },
    );
  }
}
