import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from '../../modules/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { WorkflowsModule } from '../../modules/workflows/workflows.module';
import { WeatherService } from './weather.service';
import {
  serviceNodeProviders,
  serviceProviders,
  serviceUserProviders,
} from '../../providers/database/providers/service.providers';
import { DatabaseModule } from '../../providers/database/database.module';
import { WeatherAction } from './nodes/actions/get.weather';

@Module({
  imports: [
    AuthModule,
    ConfigModule,
    forwardRef(() => WorkflowsModule),
    DatabaseModule,
  ],
  providers: [
    WeatherService,
    WeatherAction,
    ...serviceProviders,
    ...serviceNodeProviders,
    ...serviceUserProviders,
  ],
  exports: [WeatherService, WeatherAction],
})
export class WeatherModule {}
