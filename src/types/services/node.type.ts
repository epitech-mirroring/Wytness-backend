export enum NodeType {
  TRIGGER = 'trigger',
  ACTION = 'action',
}

export abstract class Node {
  public id: number;
  private readonly name: string;
  private readonly description: string;
  public readonly type: NodeType;
  callback: (data: any) => void;

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

  public setCallback(callback: (data: any) => void): void {
    this.callback = callback;
  }
}

export type ListNode = {
  id: number;
  name: string;
  type: NodeType;
};
