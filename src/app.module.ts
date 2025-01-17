import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { UsersModule } from './modules/users/users.module';
import { ConfigModule } from '@nestjs/config';
import { FirebaseModule } from './providers/firebase/firebase.module';
import { AuthModule } from './modules/auth/auth.module';
import { DiscordModule } from './services/discord/discord.module';
import { ServicesModule } from './modules/services/services.module';
import { WorkflowsModule } from './modules/workflows/workflows.module';
import { StatisticsModule } from './modules/statistics/statistics.module';
import { DatabaseModule } from './providers/database/database.module';
import { WebhookModule } from './modules/webhook/webhook.module';

@Module({
  imports: [
    UsersModule,
    ConfigModule.forRoot({ cache: true }),
    FirebaseModule,
    AuthModule,
    ServicesModule,
    DiscordModule,
    WorkflowsModule,
    StatisticsModule,
    DatabaseModule,
    WebhookModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
