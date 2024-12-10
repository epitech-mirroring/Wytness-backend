import { Node, NodeType } from './node.type';
import { Injectable } from '@nestjs/common';

@Injectable()
export abstract class Action extends Node {
  protected constructor(name: string, description: string) {
    super(name, description, NodeType.ACTION);
  }

  public abstract execute(data: any, config: any): any;

  public async run(data: any, config: any): Promise<any> {
    return this.execute(data, config);
  }
}
