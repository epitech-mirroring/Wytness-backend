import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Node } from '../../services';
import { WorkflowNodeNext } from './node.next.type';
import { Workflow } from '../workflow.type';
import { columnTypeJson, useSqlite } from '../../global';

export class Position {
  @Column('int', { default: 100 })
  x: number;
  @Column('int', { default: 100 })
  y: number;
}

@Entity('workflow_nodes')
export class WorkflowNode {
  @PrimaryGeneratedColumn()
  id: number;

  @JoinColumn()
  @ManyToOne(() => Node, { cascade: true, onDelete: 'CASCADE' })
  node: Node;

  @Column({
    type: columnTypeJson(),
    default: useSqlite() ? '{}' : {},
  })
  config: any;

  @JoinColumn()
  @ManyToOne(
    () => WorkflowNodeNext,
    (workflowNodePrevious) => workflowNodePrevious.next,
    {
      nullable: true,
      cascade: true,
      onDelete: 'SET NULL',
    },
  )
  previous?: WorkflowNodeNext;

  @JoinColumn()
  @OneToMany(
    () => WorkflowNodeNext,
    (workflowNodeNext) => workflowNodeNext.parent,
  )
  next: WorkflowNodeNext[];

  @JoinColumn()
  @ManyToOne(() => Workflow, { cascade: true, onDelete: 'CASCADE' })
  workflow: any;

  @Column(() => Position)
  position: Position;

  constructor(id: number, config: any) {
    this.id = id;
    this.config = config;
    this['toJSON'] = this.toJSON;
  }

  public addNext(node: WorkflowNode, label: string) {
    if (!this.node.labels.includes(label)) {
      throw new Error('Invalid label');
    }
    let next = null;
    if (this.next === undefined) {
      this.next = [];
    }
    for (const n of this.next) {
      if (n.label === label) {
        next = n;
        break;
      }
    }
    if (next === null) {
      next = new WorkflowNodeNext();
      next.parent = this;
      next.label = label;
      this.next.push(next);
    }
    node.previous = next;
    if (next.next === undefined) {
      next.next = [];
    }
    next.next.push(node);
  }

  public toJSON() {
    return {
      id: this.id,
      config: this.config,
      nodeId: this.node.id,
      next: (this.next ? this.next : []).map((next) => {
        return {
          label: next.label,
          next: next.next.map((node) => node.toJSON()),
        };
      }),
      position: this.position,
    };
  }

  public stringify() {
    return JSON.stringify(this.toJSON());
  }

  public toString() {
    return this.stringify();
  }
}
