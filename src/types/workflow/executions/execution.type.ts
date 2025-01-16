import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { WorkflowExecutionTrace } from './trace';
import { WorkflowExecutionStatistics } from './statistics.type';
import { Workflow } from '../workflow.type';

export enum WorkflowExecutionStatus {
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
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

  addOldData(trace: WorkflowExecutionTrace, parentTraceUUID: string) {
    if (parentTraceUUID === null) {
      trace.previous = null;
    } else {
      const parentTrace = this.traceMap.get(parentTraceUUID);
      if (parentTrace) {
        trace.setData(parentTrace.getData(), parentTrace.getIndex());
      }
    }
  }
}
