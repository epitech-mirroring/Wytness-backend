import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PrismaModule } from './providers/prisma/prisma.module';
import { UsersModule } from './modules/users/users.module';
import { ConfigModule } from '@nestjs/config';
import { FirebaseModule } from './providers/firebase/firebase.module';
import { AuthModule } from './modules/auth/auth.module';
import { DiscordModule } from './services/discord/discord.module';
import { ServicesModule } from './modules/services/services.module';
import { WorkflowsModule } from './modules/workflows/workflows.module';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    ConfigModule.forRoot({ cache: true }),
    FirebaseModule,
    AuthModule,
    ServicesModule,
    DiscordModule,
    WorkflowsModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
