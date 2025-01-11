import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { MinimalConfig, Node } from '../../../services';
import { WorkflowTraceStatistics } from './statistics.type';

@Entity('workflow_traces')
export class WorkflowExecutionTrace {
  @PrimaryGeneratedColumn()
  id: number;

  @JoinColumn()
  @ManyToOne(() => Node)
  node: Node;
  @Column('simple-json')
  input: any;
  @Column('simple-json')
  output: any;
  @Column('simple-json')
  config: any;

  @Column('simple-array')
  warnings: string[] = [];
  @Column('simple-array')
  errors: string[] = [];
  @Column(() => WorkflowTraceStatistics)
  statistics: WorkflowTraceStatistics;

  @JoinColumn()
  @ManyToOne(() => WorkflowExecutionTrace, (trace) => trace.next, {
    nullable: true,
    cascade: true,
    onDelete: 'CASCADE',
  })
  previous?: WorkflowExecutionTrace;

  @JoinColumn()
  @OneToMany(() => WorkflowExecutionTrace, (trace) => trace.previous)
  next: WorkflowExecutionTrace[];

  constructor(node: Node, config: MinimalConfig & any) {
    this.node = node;
    this.input = {};
    this.output = {};
    this.config = JSON.parse(JSON.stringify(config || {}));
    this.warnings = [];
    this.errors = [];
    this.statistics = new WorkflowTraceStatistics();
    for (const field of Object.keys(config || {})) {
      if (field === 'user' || field.startsWith('_')) {
        delete this.config[field];
      }
    }
  }
}
