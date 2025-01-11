import { Node, NodeType } from './node.type';
import { User } from '../user';
import { Field } from './field.type';
import { WorkflowExecution, WorkflowExecutionTrace } from '../workflow';

export abstract class Trigger extends Node {
  protected constructor(
    name: string,
    description: string,
    fields: Field[] = [],
  ) {
    super(name, description, NodeType.TRIGGER, fields);
  }

  public async run(
    data: any,
    config: any,
    execution: WorkflowExecution,
    parentTraceUUID: string | null,
  ): Promise<[any, string | null]> {
    const trace = new WorkflowExecutionTrace(this, config);
    trace.input = data || {};
    const out = await this.trigger(data, config, trace);
    execution.statistics.nodesExecuted++;
    trace.output = out || {};
    const uuid = execution.addTrace(trace, parentTraceUUID);
    trace.statistics.duration.end = new Date();
    return [out, uuid];
  }

  public abstract trigger(
    data: any,
    config: any,
    trace: WorkflowExecutionTrace,
  ): Promise<any>;

  public async isTriggered(
    user: User,
    config: any,
    data?: any,
  ): Promise<boolean> {
    void user;
    void config;
    void data;
    return false;
  }
}
