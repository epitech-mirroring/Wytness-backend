import { ApiProperty } from '@nestjs/swagger';
import { MinimalConfig, Node } from '../services';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../user';

@Entity('workflow_nodes')
export class WorkflowNode {
  @ApiProperty({
    description: 'The id of the Node',
    example: 1,
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description:
      'The nodeID of the Node (which is the id of the action or trigger)',
    example: 1,
  })
  @JoinColumn()
  @ManyToOne(() => Node)
  node: Node;

  @ApiProperty({
    description: 'The config of the Node',
    example: {
      config: 'config',
    },
  })
  @Column('simple-json')
  config: any;

  @ApiProperty({
    description: 'The list of next Nodes',
    example: [
      {
        id: 6,
        config: {},
        nodeID: 3,
        next: [],
      },
    ],
  })
  @JoinColumn()
  @ManyToOne(() => WorkflowNode, (workflowNode) => workflowNode.next, {
    nullable: true,
  })
  previous?: WorkflowNode;

  @JoinColumn()
  @OneToMany(() => WorkflowNode, (workflowNode) => workflowNode.previous)
  next: WorkflowNode[];

  @JoinColumn()
  @ManyToOne(() => Workflow)
  workflow: any;

  constructor(id: number, config: any) {
    this.id = id;
    this.config = config;
  }

  public addNext(node: WorkflowNode) {
    this.next.push(node);
  }

  public removeNext(id: number) {
    this.next = this.next.filter((node) => node.id !== id);
  }
}

@Entity('workflows')
export class Workflow {
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

  constructor(name: string, description: string) {
    this.name = name;
    this.description = description;
    this.entrypoints = [];
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

export class WorkflowTraceStatistics {
  @Column('simple-json')
  dataUsed: {
    upload: number;
    download: number;
  };
  @Column('simple-json')
  duration: {
    start: Date;
    end: Date;
  };

  constructor() {
    this.dataUsed = {
      upload: 0,
      download: 0,
    };
    this.duration = {
      start: new Date(),
      end: new Date(),
    };
  }
}

export class WorkflowExecutionStatistics {
  @Column('simple-json')
  dataUsed: {
    upload: number;
    download: number;
  };
  @Column('simple-json')
  duration: {
    start: Date;
    end: Date;
  };
  @Column('int')
  nodesExecuted: number;

  constructor() {
    this.dataUsed = {
      upload: 0,
      download: 0,
    };
    this.duration = {
      start: new Date(),
      end: new Date(),
    };
    this.nodesExecuted = 0;
  }
}

export enum WorkflowExecutionStatus {
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

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

@Entity('workflow_executions')
export class WorkflowExecution {
  @PrimaryGeneratedColumn()
  id: number;
  @JoinColumn()
  @ManyToOne(() => Workflow, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  workflow: Workflow;
  @Column(() => WorkflowExecutionStatistics)
  statistics: WorkflowExecutionStatistics;
  trace: WorkflowExecutionTrace;
  @Column('int')
  firstTraceId: number;
  @Column({
    type: 'enum',
    enum: WorkflowExecutionStatus,
    default: WorkflowExecutionStatus.RUNNING,
  })
  status: WorkflowExecutionStatus;

  private traceMap: Map<string, WorkflowExecutionTrace>;

  public addTrace(
    trace: WorkflowExecutionTrace,
    parent: string | null,
  ): string {
    if (parent === null) {
      this.trace = trace;
    } else {
      const parentTrace = this.traceMap.get(parent);
      if (parentTrace) {
        if (!parentTrace.next) {
          parentTrace.next = [];
        }
        parentTrace.next.push(trace);
        trace.previous = parentTrace;
      }
    }
    const uuid = crypto.randomUUID();
    this.traceMap.set(uuid, trace);
    if (trace.errors.length > 0) {
      this.end(false);
    }
    return uuid;
  }

  public end(isSuccess: boolean) {
    this.status = isSuccess
      ? WorkflowExecutionStatus.COMPLETED
      : WorkflowExecutionStatus.FAILED;
    for (const trace of this.traceMap.values()) {
      this.statistics.dataUsed.download += trace.statistics.dataUsed.download;
      this.statistics.dataUsed.upload += trace.statistics.dataUsed.upload;
    }
    const toPrint = {
      status: this.status,
      statistics: this.statistics,
      trace: this.trace,
      workflowId: this.workflow.id,
    };
    const replaceNodById = (node: WorkflowExecutionTrace) => {
      const r: any = { ...node };
      delete r.node;
      r.nodeId = node.node.id;
      r.next = node.next ? node.next.map(replaceNodById) : [];
      return r;
    };
    toPrint.trace = replaceNodById(toPrint.trace);
  }

  constructor(workflow: Workflow) {
    this.workflow = workflow;
    this.status = WorkflowExecutionStatus.RUNNING;
    this.statistics = new WorkflowExecutionStatistics();
    this.traceMap = new Map();
  }
}
