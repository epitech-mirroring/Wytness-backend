import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../user';
import { Actions, Resource } from '../permissions';
import { WorkflowNode } from './nodes';
import { WorkflowExecution } from './executions';

export type WorkflowBasicInfo = {
  id: number;
  name: string;
  description: string;
  ownerId?: number;
};

@Entity('workflows')
@Actions('read', 'create', 'update', 'delete')
export class Workflow extends Resource {
  static resourceName = 'workflows';
  @ApiProperty({
    description: 'The id of the Workflow',
    example: 1,
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'The name of the Workflow',
    example: 'My Workflow',
  })
  @Column('text')
  name: string;

  @ApiProperty({
    description: 'The description of the Workflow',
    example: 'This is a description of the Workflow',
  })
  @Column({ nullable: true })
  description?: string;

  @ApiProperty({
    description: 'The owner of the Workflow',
    example: 1,
  })
  @JoinColumn()
  @ManyToOne(() => User, { cascade: true, onDelete: 'CASCADE' })
  owner: User;

  @ApiProperty({
    description: 'The entrypoints of the Workflow',
    example: [
      {
        id: 1,
        config: {},
        nodeID: 1,
        next: [],
      },
    ],
  })
  entrypoints: WorkflowNode[];

  @ApiProperty({
    description: 'The nodes of the Workflow',
    example: [
      {
        id: 1,
        config: {},
        nodeID: 1,
        next: [],
      },
    ],
  })
  @JoinColumn()
  @OneToMany(() => WorkflowNode, (workflowNode) => workflowNode.workflow)
  nodes: WorkflowNode[];

  @JoinColumn()
  @OneToMany(() => WorkflowExecution, (execution) => execution.workflow)
  executions: WorkflowExecution[];

  strandedNodes: WorkflowNode[];

  constructor(name?: string, description?: string) {
    super();
    this.name = name;
    this.description = description;
    this.entrypoints = [];
    this.strandedNodes = [];
  }

  public addEntrypoint(node: WorkflowNode) {
    this.entrypoints.push(node);
  }

  public addNode(node: WorkflowNode) {
    if (this.nodes === undefined) {
      this.nodes = [];
    }
    this.nodes.push(node);
  }
}
