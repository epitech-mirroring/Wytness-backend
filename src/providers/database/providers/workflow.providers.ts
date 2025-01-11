import { DataSource } from 'typeorm';
import {
  Workflow,
  WorkflowExecution,
  WorkflowExecutionTrace,
  WorkflowNode,
} from '../../../types/workflow';

export const workflowProviders = [
  {
    provide: 'WORKFLOW_REPOSITORY',
    useFactory: (dataSource: DataSource) => dataSource.getRepository(Workflow),
    inject: ['DATA_SOURCE'],
  },
];

export const workflowNodeProviders = [
  {
    provide: 'WORKFLOW_NODE_REPOSITORY',
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(WorkflowNode),
    inject: ['DATA_SOURCE'],
  },
];

export const workflowExecutionProviders = [
  {
    provide: 'WORKFLOW_EXECUTION_REPOSITORY',
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(WorkflowExecution),
    inject: ['DATA_SOURCE'],
  },
];

export const workflowExecutionTraceProviders = [
  {
    provide: 'WORKFLOW_EXECUTION_TRACE_REPOSITORY',
    useFactory: (dataSource: DataSource) =>
      dataSource.getRepository(WorkflowExecutionTrace),
    inject: ['DATA_SOURCE'],
  },
];
