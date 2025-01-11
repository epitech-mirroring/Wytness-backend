import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { WorkflowNode } from './node.type';

@Entity('workflow_nodes_next')
@Unique(['parent', 'label'])
export class WorkflowNodeNext {
  @PrimaryGeneratedColumn()
  id: number;

  @JoinColumn({ name: 'parentId' })
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
