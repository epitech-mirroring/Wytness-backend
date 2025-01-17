import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
} from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { WebhookService } from './webhook.service';
import { Private } from '../auth/decorators/private.decorator';
import { AuthContext } from '../auth/auth.context';
import { CreateWebhookDTO } from '../../dtos/webhooks/webhooks.dto';
import { WorkflowsService } from '../workflows/workflows.service';

@Controller('webhooks')
export class WebhookController {
  @Inject()
  private _webhookService: WebhookService;

  @Inject()
  private _authContext: AuthContext;

  @Inject()
  private _workflowsService: WorkflowsService;

  @Public()
  @Post('/:id')
  async handleWebhook(@Param('id') id: string, @Body() body: any) {
    if (!id) {
      throw new BadRequestException('Webhook ID is required');
    }
    return this._webhookService.onWebhookCalled(id, body);
  }

  @Private()
  @Get('/')
  async getWebhooks() {
    return this._webhookService.getWebhooksForUser(this._authContext.user);
  }

  @Private()
  @Post('/')
  async createWebhook(@Body() body: CreateWebhookDTO) {
    if (!body.nodeId) {
      throw new BadRequestException('Node ID is required');
    }
    const node = this._workflowsService.findNodeById(body.nodeId);
    return this._webhookService.createWebhook(
      this._authContext.user,
      null,
      node,
    );
  }

  @Private()
  @Delete('/:id')
  async deleteWebhook(@Param('id') id: string) {
    const webhook = await this._webhookService.getWebhookById(id);
    if (!webhook) {
      throw new BadRequestException('Webhook not found');
    }
    if (webhook.owner.id !== this._authContext.user.id) {
      throw new BadRequestException('You do not own this webhook');
    }
    await this._webhookService.deleteWebhook(id, this._authContext.user);
  }
}
