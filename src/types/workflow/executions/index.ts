import { Column } from 'typeorm';
import { columnTypeTimestamp } from '../../global';

export * from './execution.type';
export * from './statistics.type';
export * from './trace';

export class WorkflowExecutionStatisticsDataUsed {
  @Column('int')
  upload: number;
  @Column('int')
  download: number;
}

export class WorkflowExecutionStatisticsDuration {
  @Column({
    type: columnTypeTimestamp(),
  })
  start: Date;
  @Column({
    type: columnTypeTimestamp(),
  })
  end: Date;
}
