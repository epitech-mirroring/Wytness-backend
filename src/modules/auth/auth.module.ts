import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { FirebaseModule } from 'src/providers/firebase/firebase.module';
import { AuthContext } from './auth.context';
import { DatabaseModule } from '../../providers/database/database.module';
import { userProviders } from '../../providers/database/providers/user.providers';
import { PermissionsModule } from '../permissions/permissions.module';
import { RequestScopeModule } from 'nj-request-scope';

@Module({
  imports: [
    FirebaseModule,
    DatabaseModule,
    PermissionsModule,
    RequestScopeModule,
  ],
  providers: [AuthService, AuthContext, ...userProviders],
  controllers: [AuthController],
  exports: [AuthContext, AuthService],
})
export class AuthModule {}
