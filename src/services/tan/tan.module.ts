import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TanService } from './tan.service';
import { WorkflowsModule } from '../../modules/workflows/workflows.module';
import { AuthModule } from '../../modules/auth/auth.module';
import { GetSchedule } from './node/action/get.schedule';
import { GetStops } from './node/action/get.stops';
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
  providers: [TanService, GetSchedule, GetStops],
  exports: [TanService, GetSchedule, GetStops],
})
export class TanModule {}
