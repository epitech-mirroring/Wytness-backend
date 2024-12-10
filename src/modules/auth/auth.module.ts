import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { FirebaseModule } from 'src/providers/firebase/firebase.module';
import { AuthMiddleware } from './auth.middleware';

@Module({
  imports: [UsersModule, FirebaseModule],
  providers: [AuthService, AuthMiddleware],
  controllers: [AuthController],
})
export class AuthModule {}
