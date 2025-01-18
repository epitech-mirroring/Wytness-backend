import { User } from '../user';
import { WorkflowsService } from '../../modules/workflows/workflows.service';
import { Service } from './service.type';
import { Field } from './field.type';
import {
  WorkflowExecution,
  WorkflowExecutionStatus,
  WorkflowExecutionTrace,
} from '../workflow';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ExecutionsService } from '../../modules/workflows/executions.service';
import process from 'node:process';

export enum NodeType {
  TRIGGER = 'trigger',
  ACTION = 'action',
}

export interface MinimalConfig {
  user: User;
  _workflowId: number;
  _next: { [key: string]: number[] };
}

@Entity('nodes')
export abstract class Node {
  @PrimaryGeneratedColumn()
  public id: number;
  @Column('text')
  public name: string;
  @Column('text', { nullable: true })
  public description?: string;
  @Column({
    type: 'simple-enum',
    enum: NodeType,
    default: NodeType.ACTION,
  })
  public type: NodeType;
  @JoinColumn()
  @ManyToOne(() => Service, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  public service: Service;

  @Column('text', { array: true, nullable: true })
  public labels: string[];

  private readonly fields: Field[] = [];

  protected fetch = async (
    trace: WorkflowExecutionTrace,
    url: string,
    options?: RequestInit,
  ): Promise<Response> => {
    let sentSize = 0;
    if (options) {
      for (const key in options.headers) {
        sentSize += key.length + options.headers[key].length;
      }
      if (options.body) {
        if (typeof options.body === 'string') {
          sentSize += options.body.length;
        } else {
          sentSize += JSON.stringify(options.body).length;
        }
      }
    }
    const response = await fetch(url, options).then((response) => {
      trace.statistics.dataUsed.upload += sentSize;
      return response;
    });
    const duplicate = response.clone();
    const body = await duplicate.text();
    let receivedSize = body.length;
    for (const key in response.headers) {
      receivedSize += key.length + response.headers[key].length;
    }
    trace.statistics.dataUsed.download += receivedSize;
    return response;
  };

  protected constructor(
    name: string,
    description: string,
    labels: string[] = ['output'],
    type: NodeType,
    fields: Field[] = [],
  ) {
    this.name = name;
    this.description = description;
    this.labels = labels;
    this.type = type;
    this.fields = fields;
  }

  public getName(): string {
    return this.name;
  }

  public getDescription(): string {
    return this.description;
  }

  public getFields(): Field[] {
    return this.fields;
  }

  public abstract getWorkflowService(): WorkflowsService;

  public abstract getExecutionService(): ExecutionsService;

  public async _run(
    label: string,
    data: any,
    config: MinimalConfig & any,
    workflowExecution: WorkflowExecution,
    parentTraceUUID: string | null,
  ): Promise<void> {
    if (workflowExecution.status !== WorkflowExecutionStatus.RUNNING) {
      return;
    }
    const [result, traceUUID] = await this.run(
      label,
      data,
      config,
      workflowExecution,
      parentTraceUUID,
    );
    if (
      workflowExecution.status !== WorkflowExecutionStatus.RUNNING ||
      result === null
    ) {
      return;
    }
    for (const next of config._next[label]) {
      await this.getExecutionService().runNode(
        next,
        result,
        workflowExecution,
        traceUUID,
      );
    }
    if (parentTraceUUID === null) {
      workflowExecution.end(true);
    }
  }

  public abstract run(
    outputLabel: string,
    data: any,
    config: MinimalConfig & any,
    workflowExecution: WorkflowExecution,
    parentTraceUUID: string | null,
  ): Promise<[any | null, string | null]>;

  protected getService(): Service {
    return this.getWorkflowService().getServices().getServiceFromNode(this.id);
  }

  protected info(msg: any, ...args: any[]): void {
    const serviceName =
      this.getService().name[0].toUpperCase() + this.getService().name.slice(1);
    console.info(
      `[${new Date().toISOString()}] [${serviceName}/${this.name[0].toUpperCase() + this.name.slice(1)}/INFO] `,
      msg,
      ...args,
    );
  }

  protected error(
    trace: WorkflowExecutionTrace,
    msg: any,
    ...args: any[]
  ): void {
    const serviceName =
      this.getService().name[0].toUpperCase() + this.getService().name.slice(1);
    console.error(
      `[${new Date().toISOString()}] [${serviceName}/${this.name[0].toUpperCase() + this.name.slice(1)}/ERROR] `,
      msg,
      ...args,
    );
    trace.errors.push(msg);
  }

  protected warn(
    trace: WorkflowExecutionTrace,
    msg: any,
    ...args: any[]
  ): void {
    const serviceName =
      this.getService().name[0].toUpperCase() + this.getService().name.slice(1);
    console.warn(
      `[${new Date().toISOString()}] [${serviceName}/${this.name[0].toUpperCase() + this.name.slice(1)}/WARN] `,
      msg,
      ...args,
    );
    trace.warnings.push(msg);
  }

  protected debug(msg: any, ...args: any[]): void {
    const serviceName =
      this.getService().name[0].toUpperCase() + this.getService().name.slice(1);
    console.debug(
      `[${new Date().toISOString()}] [${serviceName}/${this.name[0].toUpperCase() + this.name.slice(1)}/DEBUG] `,
      msg,
      ...args,
    );
  }
}

export type ListNode = {
  id: number;
  name: string;
  type: NodeType;
};
