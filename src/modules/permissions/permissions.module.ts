import { Module } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { ResourcesService } from './resources.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Policy, Rule } from '../../types/permissions';
import { User } from '../../types/user';

@Module({
  imports: [TypeOrmModule.forFeature([Rule, Policy, User])],
  providers: [PermissionsService, ResourcesService],
  exports: [PermissionsService],
})
export class PermissionsModule {}
