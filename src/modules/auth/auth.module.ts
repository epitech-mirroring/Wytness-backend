import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { FirebaseModule } from 'src/providers/firebase/firebase.module';
import { AuthContext } from './auth.context';
import { PrismaModule } from '../../providers/prisma/prisma.module';

@Module({
  imports: [FirebaseModule, PrismaModule],
  providers: [AuthService, AuthContext],
  controllers: [AuthController],
  exports: [AuthContext, AuthService],
})
export class AuthModule {}
