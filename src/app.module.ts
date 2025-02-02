import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { UsersModule } from './modules/users/users.module';
import { FirebaseModule } from './providers/firebase/firebase.module';
import { AuthModule } from './modules/auth/auth.module';
import { DiscordModule } from './services/discord/discord.module';
import { ServicesModule } from './modules/services/services.module';
import { WorkflowsModule } from './modules/workflows/workflows.module';
import { StatisticsModule } from './modules/statistics/statistics.module';
import { WebhookModule } from './modules/webhook/webhook.module';
import { WeatherModule } from './services/weather/weather.module';
import { User } from './types/user';
import { Policy, Resource, Rule } from './types/permissions';
import {
  Workflow,
  WorkflowExecution,
  WorkflowExecutionTrace,
  WorkflowNode,
  WorkflowNodeNext,
} from './types/workflow';
import { Code, Node, Service, ServiceUser } from './types/services';
import { Webhook } from './types/webhook/webhook.type';
import * as process from 'node:process';
import { useSqlite } from './types/global';
import { OpeniaModule } from './services/openia/openia.module';
import { TanModule } from './services/tan/tan.module';
import { GeocodingModule } from './services/geocoding/geo.module';

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
    WeatherModule,
    OpeniaModule,
    TanModule,
    GeocodingModule,
    useSqlite()
      ? TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [
            User,
            Rule,
            Policy,
            Workflow,
            WorkflowNode,
            WorkflowExecution,
            WorkflowExecutionTrace,
            Service,
            Node,
            ServiceUser,
            Code,
            WorkflowNodeNext,
            Webhook,
          ],
          synchronize: true,
        })
      : TypeOrmModule.forRoot({
          type: 'postgres',
          url: process.env.DATABASE_URL,
          entities: [
            User,
            Rule<Resource>,
            Policy,
            Workflow,
            WorkflowNode,
            WorkflowExecution,
            WorkflowExecutionTrace,
            Service,
            Node,
            ServiceUser,
            Code,
            WorkflowNodeNext,
            Webhook,
          ],
          synchronize: true,
        }),
    WebhookModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
