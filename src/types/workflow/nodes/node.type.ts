import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Node } from '../../services';
import { WorkflowNodePrevious } from './node.previous.type';
import { WorkflowNodeNext } from './node.next.type';
import { Workflow } from '../workflow.type';

@Entity('workflow_nodes')
export class WorkflowNode {
  @PrimaryGeneratedColumn()
  id: number;

  @JoinColumn()
  @ManyToOne(() => Node, { eager: true })
  node: Node;

  @Column('simple-json')
  config: any;

  @JoinColumn()
  @OneToOne(
    () => WorkflowNodePrevious,
    (workflowNodePrevious) => workflowNodePrevious.parent,
    {
      nullable: true,
    },
  )
  previous?: WorkflowNodePrevious;

  @JoinColumn()
  @OneToMany(
    () => WorkflowNodeNext,
    (workflowNodeNext) => workflowNodeNext.parent,
  )
  next: WorkflowNodeNext[];

  @JoinColumn()
  @ManyToOne(() => Workflow)
  workflow: any;

  constructor(id: number, config: any) {
    this.id = id;
    this.config = config;
  }

  public addNext(node: WorkflowNode, label: string) {
    if (!this.node.labels.includes(label)) {
      throw new Error('Invalid label');
    }
    let next = null;
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
    next.next.push(node);
  }
}
