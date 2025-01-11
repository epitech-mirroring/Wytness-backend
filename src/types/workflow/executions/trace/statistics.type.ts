import { Column } from 'typeorm';
import {
  WorkflowExecutionStatisticsDataUsed,
  WorkflowExecutionStatisticsDuration,
} from '../index';

export class WorkflowTraceStatistics {
  @Column(() => WorkflowExecutionStatisticsDataUsed)
  dataUsed: WorkflowExecutionStatisticsDataUsed;
  @Column(() => WorkflowExecutionStatisticsDuration)
  duration: WorkflowExecutionStatisticsDuration;

  constructor() {
    this.dataUsed = {
      upload: 0,
      download: 0,
    };
    this.duration = {
      start: new Date(),
      end: new Date(),
    };
  }
}
