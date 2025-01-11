import { forwardRef, Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../../providers/database/database.module';
import { userProviders } from '../../providers/database/providers/user.providers';
import { PermissionsModule } from '../permissions/permissions.module';

@Module({
  imports: [forwardRef(() => AuthModule), DatabaseModule, PermissionsModule],
  providers: [UsersService, ...userProviders],
  exports: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
