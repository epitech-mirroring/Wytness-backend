import { User } from '../user';
import { Inject, Injectable } from '@nestjs/common';
import { WorkflowsService } from '../../modules/workflows/workflows.service';

export enum NodeType {
  TRIGGER = 'trigger',
  ACTION = 'action',
}

export interface MinimalConfig {
  user: User;
  _workflowId: number;
  _next: number[];
}

@Injectable()
export abstract class Node {
  public id: number;
  private readonly name: string;
  private readonly description: string;
  public readonly type: NodeType;

  @Inject()
  protected readonly _workflowService: WorkflowsService;

  protected constructor(name: string, description: string, type: NodeType) {
    this.name = name;
    this.description = description;
    this.type = type;
  }

  public getName(): string {
    return this.name;
  }

  public getDescription(): string {
    return this.description;
  }

  public async _run(data: any, config: MinimalConfig & any) {
    const r = await this.run(data, config);
    for (const next of config._next) {
      await this._workflowService.runNode(next, r);
    }
  }

  public abstract run(data: any, config: MinimalConfig & any): Promise<any>;
}

export type ListNode = {
  id: number;
  name: string;
  type: NodeType;
};
