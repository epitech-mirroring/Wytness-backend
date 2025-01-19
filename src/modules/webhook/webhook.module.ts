import { Module } from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { WorkflowsModule } from '../workflows/workflows.module';
import { ServicesModule } from '../services/services.module';
import { WebhookController } from './webhook.controller';
import { AuthModule } from '../auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Webhook } from '../../types/webhook/webhook.type';

@Module({
  imports: [
    WorkflowsModule,
    ServicesModule,
    AuthModule,
    TypeOrmModule.forFeature([Webhook]),
  ],
  providers: [WebhookService],
  controllers: [WebhookController],
})
export class WebhookModule {}
