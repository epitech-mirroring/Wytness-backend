import { Node, NodeType } from './node.type';
import { Field } from './field.type';
import { WorkflowExecution, WorkflowExecutionTrace } from '../workflow';

export abstract class Action extends Node {
  protected constructor(
    name: string,
    description: string,
    labels: string[] = ['output'],
    fields: Field[] = [],
  ) {
    super(name, description, labels, NodeType.ACTION, fields);
  }

  public abstract execute(
    outputLabel: string,
    data: any,
    config: any,
    trace: WorkflowExecutionTrace,
  ): Promise<any>;

  public async run(
    outputLabel: string,
    data: any,
    config: any,
    execution: WorkflowExecution,
    parentTraceUUID: string | null,
  ): Promise<[any, string | null]> {
    const trace = new WorkflowExecutionTrace(this, config);
    trace.input = data || {};
    const out = await this.execute(outputLabel, data, config, trace);
    execution.statistics.nodesExecuted++;
    trace.output = out || {};
    const uuid = execution.addTrace(trace, parentTraceUUID);
    trace.statistics.duration.end = new Date();
    return [out, uuid];
  }
}
