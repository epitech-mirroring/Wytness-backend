import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { WorkflowNode } from './node.type';

@Entity('workflow_nodes_next')
@Index(['parent', 'label'], { unique: true })
export class WorkflowNodeNext {
  @PrimaryGeneratedColumn()
  id: number;

  @JoinColumn()
  @ManyToOne(() => WorkflowNode, (workflowNode) => workflowNode.next, {
    eager: true,
  })
  parent: WorkflowNode;

  @JoinColumn()
  @OneToMany(
    () => WorkflowNode,
    (workflowNodePrevious) => workflowNodePrevious.previous,
  )
  next: WorkflowNode[];

  @Column('text')
  label: string;
}
