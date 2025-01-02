import { Module } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { ResourcesService } from './resources.service';
import { PrismaModule } from '../../providers/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [PermissionsService, ResourcesService],
  exports: [PermissionsService],
})
export class PermissionsModule {}
