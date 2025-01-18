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
import { WebhookModule } from './modules/webhook/webhook.module';
import { TypeOrmModule } from '@nestjs/typeorm';
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
    process.env.DB_HOST
      ? TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DB_HOST,
          port: parseInt(process.env.DB_PORT),
          username: process.env.DB_USERNAME,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_NAME,
          schema: process.env.DB_SCHEMA,
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
        })
      : TypeOrmModule.forRoot({
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
        }),
    WebhookModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
