import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { FirebaseModule } from '../../providers/firebase/firebase.module';
import { AuthContext } from './auth.context';
import { PermissionsModule } from '../permissions/permissions.module';
import { RequestScopeModule } from 'nj-request-scope';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../types/user';

@Module({
  imports: [
    FirebaseModule,
    TypeOrmModule.forFeature([User]),
    PermissionsModule,
    RequestScopeModule,
  ],
  providers: [AuthService, AuthContext],
  controllers: [AuthController],
  exports: [AuthContext, AuthService],
})
export class AuthModule {}
