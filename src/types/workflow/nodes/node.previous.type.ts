import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { WorkflowNode } from './node.type';
import { WorkflowNodeNext } from './node.next.type';

@Entity('workflows_nodes_previous')
export class WorkflowNodePrevious {
  @PrimaryGeneratedColumn()
  id: number;

  @JoinColumn({ name: 'parentId' })
  @OneToOne(() => WorkflowNode, (workflowNode) => workflowNode.previous, {
    eager: true,
  })
  parent: WorkflowNode;

  @JoinColumn({ name: 'nextId' })
  @ManyToOne(() => WorkflowNodeNext, { eager: true })
  previous: WorkflowNodeNext;

  @Column('text')
  label: string;
}
