import { DataSource } from 'typeorm';
import { Webhook } from '../../../types/webhook/webhook.type';

export const webhookProviders = [
  {
    provide: 'WEBHOOK_REPOSITORY',
    useFactory: (dataSource: DataSource) => {
      if (!dataSource) {
        return null;
      }
      return dataSource.getRepository(Webhook);
    },
    inject: ['DATA_SOURCE'],
  },
];
