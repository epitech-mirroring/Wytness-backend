import { Module } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { ResourcesService } from './resources.service';
import { DatabaseModule } from '../../providers/database/database.module';
import {
  policiesProviders,
  rulesProviders,
} from '../../providers/database/providers/permission.providers';
import { userProviders } from '../../providers/database/providers/user.providers';

@Module({
  imports: [DatabaseModule],
  providers: [
    PermissionsService,
    ResourcesService,
    ...rulesProviders,
    ...policiesProviders,
    ...userProviders,
  ],
  exports: [PermissionsService],
})
export class PermissionsModule {}
