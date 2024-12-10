import { Node, NodeType } from './node.type';

export abstract class Trigger extends Node {
  protected constructor(name: string, description: string) {
    super(name, description, NodeType.TRIGGER);
  }

  public abstract trigger(data: any): any;

  public _trigger(data: any): void {
    if (this.callback) {
      this.callback(this.trigger(data));
    }
  }
}
