import { DataSource } from 'typeorm';
import { User } from '../../../types/user';

export const userProviders = [
  {
    provide: 'USER_REPOSITORY',
    useFactory: (dataSource: DataSource) => {
      if (!dataSource) {
        return null;
      }
      return dataSource.getRepository(User);
    },
    inject: ['DATA_SOURCE'],
  },
];
