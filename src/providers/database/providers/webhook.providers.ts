import { DataSource } from 'typeorm';
import { Webhook } from '../../../types/webhook/webhook.type';

export const webhookProviders = [
  {
    provide: 'WEBHOOK_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Webhook),
    inject: ['DATA_SOURCE'],
  },
];
