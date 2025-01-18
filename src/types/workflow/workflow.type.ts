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
import { NodeType } from '../services';
import process from 'node:process';
import { columnTypeEnum } from '../global';

export type WorkflowBasicInfo = {
  id: number;
  name: string;
  description: string;
  ownerId?: number;
  serviceUsed: string[];
  status: WorkflowStatus;
};

export enum WorkflowStatus {
  ENABLED = 'enabled',
  DISABLED = 'disabled',
  ERROR = 'error',
}

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
    description: 'The status of the Workflow',
    example: 'enabled',
  })
  @Column({
    type: columnTypeEnum(),
    enum: WorkflowStatus,
    default: WorkflowStatus.DISABLED,
  })
  status: WorkflowStatus;

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

  constructor(name?: string, description?: string, status?: WorkflowStatus) {
    super();
    this.name = name;
    this.description = description;
    this.status = status || WorkflowStatus.DISABLED;
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
    if (!node.previous && node.node.type !== NodeType.TRIGGER) {
      this.strandedNodes.push(node);
    } else {
      if (node.node.type === NodeType.TRIGGER) {
        this.entrypoints.push(node);
      } else {
        this.nodes.push(node);
      }
    }
  }

  public toJson() {
    const services = [];
    const recursiveServiceSetup = (node: WorkflowNode) => {
      services.push(node.node.service.name);
      for (const next of node.next) {
        for (const nextNode of next.next) {
          recursiveServiceSetup(nextNode);
        }
      }
    };
    for (const node of this.entrypoints) {
      recursiveServiceSetup(node);
    }
    for (const node of this.strandedNodes) {
      recursiveServiceSetup(node);
    }

    return {
      id: this.id,
      name: this.name,
      description: this.description,
      ownerId: this.owner.id,
      serviceUsed: services.filter((v, i, a) => a.indexOf(v) === i),
      status: this.status,
    } as WorkflowBasicInfo;
  }
}
