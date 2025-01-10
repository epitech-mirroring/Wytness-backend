import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '../../types/user';
import { Policy, Resource, Rule } from '../../types/permissions';
import {
  Workflow,
  WorkflowExecution,
  WorkflowExecutionTrace,
  WorkflowNode,
} from '../../types/workflow';
import { Code, Node, Service, ServiceUser } from '../../types/services';

export const databaseProviders = [
  {
    provide: 'DATA_SOURCE',
    inject: [ConfigService],
    useFactory: (configService: ConfigService) => {
      const dataSource = new DataSource({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        schema: configService.get<string>('DB_SCHEMA'),
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
        ],
        synchronize: true,
      });
      return dataSource.initialize();
    },
  },
];
