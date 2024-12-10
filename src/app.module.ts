import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './providers/prisma/prisma.module';
import { UsersModule } from './modules/users/users.module';
import { ConfigModule } from '@nestjs/config';
import { FirebaseModule } from './providers/firebase/firebase.module';
import { AuthModule } from './modules/auth/auth.module';
import { SpotifyModule } from './modules/spotify/spotify.module';
import { AuthMiddleware } from './modules/auth/auth.middleware';

@Module({
  // Import the PrismaModule to use the PrismaService in the AppService
  imports: [PrismaModule, UsersModule, ConfigModule.forRoot({ cache: true }), FirebaseModule, AuthModule, SpotifyModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .forRoutes('spotify/login', 'spotify/disconnect', 'users/me');
  }
}
