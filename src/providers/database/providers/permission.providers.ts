import { DataSource } from 'typeorm';
import { Policy, Rule } from '../../../types/permissions';

export const policiesProviders = [
  {
    provide: 'POLICIES_REPOSITORY',
    useFactory: (dataSource: DataSource) => {
      if (!dataSource) {
        return null;
      }
      return dataSource.getRepository(Policy);
    },
    inject: ['DATA_SOURCE'],
  },
];

export const rulesProviders = [
  {
    provide: 'RULES_REPOSITORY',
    useFactory: (dataSource: DataSource) => {
      if (!dataSource) {
        return null;
      }
      return dataSource.getRepository(Rule);
    },
    inject: ['DATA_SOURCE'],
  },
];
