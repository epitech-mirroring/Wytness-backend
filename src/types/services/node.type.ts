import { User } from '../user';
import { WorkflowsService } from '../../modules/workflows/workflows.service';
import { Service } from './service.type';
import { Field } from './field.type';

export enum NodeType {
  TRIGGER = 'trigger',
  ACTION = 'action',
}

export interface MinimalConfig {
  user: User;
  _workflowId: number;
  _next: number[];
}

export abstract class Node {
  public id: number;
  private readonly name: string;
  private readonly description: string;
  public readonly type: NodeType;
  private readonly fields: Field[] = [];

  protected constructor(name: string, description: string, type: NodeType, fields: Field[] = []) {
    this.name = name;
    this.description = description;
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

  public async _run(data: any, config: MinimalConfig & any) {
    const r = await this.run(data, config);
    for (const next of config._next) {
      await this.getWorkflowService().runNode(next, r);
    }
  }

  public abstract run(data: any, config: MinimalConfig & any): Promise<any>;

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

  protected error(msg: any, ...args: any[]): void {
    const serviceName =
      this.getService().name[0].toUpperCase() + this.getService().name.slice(1);
    console.error(
      `[${new Date().toISOString()}] [${serviceName}/${this.name[0].toUpperCase() + this.name.slice(1)}/ERROR] `,
      msg,
      ...args,
    );
  }

  protected warn(msg: any, ...args: any[]): void {
    const serviceName =
      this.getService().name[0].toUpperCase() + this.getService().name.slice(1);
    console.warn(
      `[${new Date().toISOString()}] [${serviceName}/${this.name[0].toUpperCase() + this.name.slice(1)}/WARN] `,
      msg,
      ...args,
    );
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
