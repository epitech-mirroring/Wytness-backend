import { Module } from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { DatabaseModule } from '../../providers/database/database.module';
import { webhookProviders } from '../../providers/database/providers/webhook.providers';
import { WorkflowsModule } from '../workflows/workflows.module';
import { ServicesModule } from '../services/services.module';
import { WebhookController } from './webhook.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [DatabaseModule, WorkflowsModule, ServicesModule, AuthModule],
  providers: [WebhookService, ...webhookProviders],
  controllers: [WebhookController],
})
export class WebhookModule {}
