import { Node, NodeType } from './node.type';

export abstract class Action extends Node {
  protected constructor(name: string, description: string) {
    super(name, description, NodeType.ACTION);
  }

  public abstract execute(data: any): any;

  public _execute(data: any): void {
    if (this.callback) {
      this.callback(this.execute(data));
    }
  }
}
