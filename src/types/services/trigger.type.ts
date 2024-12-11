import { Node, NodeType } from './node.type';
import { User } from '../user';
import { Injectable } from '@nestjs/common';

@Injectable()
export abstract class Trigger extends Node {
  protected constructor(name: string, description: string) {
    super(name, description, NodeType.TRIGGER);
  }

  public async run(data: any, config: any): Promise<any> {
    return this.trigger(data, config);
  }

  public abstract trigger(data: any, config: any): any;

  public async isTriggered(user: User, config: any): Promise<boolean> {
    void user;
    void config;
    return false;
  }
}
