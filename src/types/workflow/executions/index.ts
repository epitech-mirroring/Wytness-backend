import { Column } from 'typeorm';

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
    type: 'timestamp',
    precision: 3,
  })
  start: Date;
  @Column({
    type: 'timestamp',
    precision: 3,
  })
  end: Date;
}
