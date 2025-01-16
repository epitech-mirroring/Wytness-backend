import { Column } from 'typeorm';
import {
  WorkflowExecutionStatisticsDataUsed,
  WorkflowExecutionStatisticsDuration,
} from './index';

export class WorkflowExecutionStatistics {
  @Column(() => WorkflowExecutionStatisticsDataUsed)
  dataUsed: WorkflowExecutionStatisticsDataUsed;
  @Column(() => WorkflowExecutionStatisticsDuration)
  duration: WorkflowExecutionStatisticsDuration;
  @Column('int')
  nodesExecuted: number;

  constructor() {
    this.dataUsed = {
      upload: 0,
      download: 0,
    };
    this.duration = {
      start: new Date(),
      end: new Date(),
    };
    this.nodesExecuted = 0;
  }
}
