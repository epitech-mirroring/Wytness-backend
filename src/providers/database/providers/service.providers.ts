import { DataSource } from 'typeorm';
import { Service, Node, Code, ServiceUser } from '../../../types/services';

export const serviceProviders = [
  {
    provide: 'SERVICE_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Service),
    inject: ['DATA_SOURCE'],
  },
];

export const serviceNodeProviders = [
  {
    provide: 'SERVICE_NODE_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Node),
    inject: ['DATA_SOURCE'],
  },
];

export const codeProviders = [
  {
    provide: 'CODE_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Code),
    inject: ['DATA_SOURCE'],
  },
];

export const serviceUserProviders = [
  {
    provide: 'SERVICE_USER_REPOSITORY',
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(ServiceUser),
    inject: ['DATA_SOURCE'],
  },
];
