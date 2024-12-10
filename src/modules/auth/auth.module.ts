import { forwardRef, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { FirebaseModule } from 'src/providers/firebase/firebase.module';
import { AuthContext } from './auth.context';

@Module({
  imports: [forwardRef(() => UsersModule), FirebaseModule],
  providers: [AuthService, AuthContext],
  controllers: [AuthController],
  exports: [AuthContext, AuthService],
})
export class AuthModule {}
