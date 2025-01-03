import { Node, NodeType } from './node.type';
import { Field } from './field.type';

export abstract class Action extends Node {
  protected constructor(name: string, description: string, fields: Field[] = []) {
    super(name, description, NodeType.ACTION, fields);
  }

  public abstract execute(data: any, config: any): any;

  public async run(data: any, config: any): Promise<any> {
    return this.execute(data, config);
  }
}
