import { Inject, Injectable } from '@nestjs/common';
import { User } from '../../types/user';
import { ServiceWithWebhooks } from '../../types/services';
import { Repository } from 'typeorm';
import { Webhook } from '../../types/webhook/webhook.type';
import { WorkflowNode } from '../../types/workflow';
import { WorkflowsService } from '../workflows/workflows.service';
import { ServicesService } from '../services/services.service';
import { InjectRepository } from '@nestjs/typeorm';
import { ExecutionsService } from '../workflows/executions.service';

@Injectable()
export class WebhookService {
  @InjectRepository(Webhook)
  private readonly _webhookRepository: Repository<Webhook>;

  @Inject()
  private readonly _services: ServicesService;

  @Inject()
  private readonly _executions: ExecutionsService;

  public async createWebhook(
    forUser: User,
    forService: ServiceWithWebhooks | null,
    node: WorkflowNode | null,
  ): Promise<void> {
    const webhook = this._webhookRepository.create();
    if (forService) {
      webhook.managed = true;
      webhook.manager = forService;
    } else {
      webhook.managed = false;
      webhook.node = node;
    }
    webhook.owner = forUser;
    await this._webhookRepository.save(webhook);
  }

  public async getWebhookById(id: string): Promise<Webhook | undefined> {
    return this._webhookRepository.findOne({
      where: { id },
      relations: ['node', 'manager', 'owner'],
    });
  }

  public async getWebhooksForUser(user: User): Promise<Webhook[]> {
    return this._webhookRepository.find({
      where: { owner: { id: user.id } },
      relations: ['node', 'manager'],
    });
  }

  public async onWebhookCalled(id: string, data: any): Promise<void> {
    const webhook = await this.getWebhookById(id);
    if (!webhook) {
      throw new Error('Webhook not found');
    }
    if (webhook.managed && webhook.manager) {
      await this._services.manageWebhook(
        webhook.manager,
        id,
        data,
        webhook.owner,
      );
    } else if (webhook.node) {
      await this._executions.findAndTriggerGlobal(data, webhook.node.id);
    }
  }

  public async deleteWebhook(id: string, performer: User): Promise<void> {
    const webhook = await this.getWebhookById(id);
    if (!webhook) {
      throw new Error('Webhook not found');
    }
    if (webhook.owner.id !== performer.id) {
      throw new Error('You are not allowed to delete this webhook');
    }
    await this._webhookRepository.delete({ id });
  }
}
