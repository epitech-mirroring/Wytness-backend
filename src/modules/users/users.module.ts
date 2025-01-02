import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaModule } from '../../providers/prisma/prisma.module';
import { UsersController } from './users.controller';
import { AuthModule } from '../auth/auth.module';
import { PermissionsModule } from '../permissions/permissions.module';

@Module({
  imports: [PrismaModule, AuthModule, PermissionsModule],
  providers: [UsersService],
  exports: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
