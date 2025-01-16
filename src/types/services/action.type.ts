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
    config: any,
    trace: WorkflowExecutionTrace,
  ): Promise<any | null>;

  public async run(
    outputLabel: string,
    data: any,
    config: any,
    execution: WorkflowExecution,
    parentTraceUUID: string | null,
  ): Promise<[any | null, string | null]> {
    const trace = new WorkflowExecutionTrace(this, config);
    trace.input = data || {};
    execution.addOldData(trace, parentTraceUUID);
    const out = await this.execute(outputLabel, config, trace);
    execution.statistics.nodesExecuted++;
    trace.output = out || {};
    trace.addData(out);
    const uuid = execution.addTrace(trace, parentTraceUUID);
    trace.statistics.duration.end = new Date();
    return [out, uuid];
  }
}
