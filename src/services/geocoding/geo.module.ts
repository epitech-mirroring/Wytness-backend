import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GeocodingService } from './geo.service';
import { WorkflowsModule } from '../../modules/workflows/workflows.module';
import { AuthModule } from '../../modules/auth/auth.module';
import { GetCoordinate } from './node/action/get.coordinate';
import { GetAddress } from './node/action/get.address';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Node, Service, ServiceUser } from '../../types/services';
import { User } from '../../types/user';

@Module({
  imports: [
    AuthModule,
    ConfigModule,
    forwardRef(() => WorkflowsModule),
    TypeOrmModule.forFeature([Service, User, Node, ServiceUser]),
  ],
  providers: [GeocodingService, GetCoordinate, GetAddress],
  exports: [GeocodingService, GetCoordinate, GetAddress],
})
export class GeocodingModule {}
