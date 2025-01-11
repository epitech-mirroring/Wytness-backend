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

  private data: any;

  private index: number;

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
    this.index = 0;
    this.data = {};
  }

  public setData(data: any, index: number): void {
    this.data = data;
    this.index = ++index;
  }

  public addData(newData: any): void {
    this.data[`[${this.index}]`] = {
      ...this.data[`[${this.index}]`],
      ...newData,
    };
  }

  getData() {
    return this.data;
  }

  getIndex() {
    return this.index;
  }

  private processGlobalVariables(path: string): string {
    const pathArray = path.split('.');
    let current: any = {
      currentDate: new Date(),
    };
    for (const p of pathArray) {
      if (p.endsWith(')')) {
        // Call function
        const functionName = p.split('(')[0];
        const functionArgs = p.split('(')[1].slice(0, -1).split(',');
        if (current[functionName] === undefined) {
          return 'undefined';
        }
        if (typeof current[functionName] !== 'function') {
          return 'undefined';
        }
        current = current[functionName](...functionArgs);
        continue;
      }
      if (current[p] === undefined) {
        return 'undefined';
      }
      current = current[p];
    }
    return current;
  }

  public processStringWithVariables(str: string): string {
    const regex = /(\${{(\[(?<index>\d+)]\.)?(?<path>[a-zA-Z-_0-9.]+)}})/gm;
    return str.replace(regex, (match, _, __, index, path) => {
      if (index) {
        const indexInt = parseInt(index, 10);
        if (indexInt >= this.index) {
          console.error(
            `Trying to access data from the future. Index: ${indexInt}, Current Index: ${this.index}`,
          );
          return 'undefined';
        }
        const data = this.data[`[${index}]`];
        if (!data) {
          console.error(`Data not found for index: ${indexInt}`);
          return 'undefined';
        }
        const pathArray = path.split('.');
        let current = data;
        for (const p of pathArray) {
          if (current[p] === undefined) {
            console.error(`Path not found: ${path}`);
            return 'undefined';
          }
          current = current[p];
        }
        return current;
      } else {
        return this.processGlobalVariables(path);
      }
    });
  }
}
