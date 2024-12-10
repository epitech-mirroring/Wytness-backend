import { Node, NodeType } from './node.type';
import { User } from '../user';

export abstract class Trigger extends Node {
  protected constructor(name: string, description: string) {
    super(name, description, NodeType.TRIGGER);
  }

  public async run(data: any, config: any): Promise<any> {
    return this.trigger(data, config);
  }

  public abstract trigger(data: any, config: any): any;

  public async isTriggered(user: User, config: any): Promise<boolean> {
    return false;
  }
}
