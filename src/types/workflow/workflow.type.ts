export class WorkflowNode {
  id: number;
  nodeID: number;
  config: any;

  next: WorkflowNode[];

  constructor(nodeID: number, config: any) {
    this.nodeID = nodeID;
    this.config = config;
  }

  public addNext(node: WorkflowNode) {
    this.next.push(node);
  }

  public removeNext(id: number) {
    this.next = this.next.filter((node) => node.id !== id);
  }
}

export class Workflow {
  id: number;
  name: string;
  description: string;
  owner: number;

  entrypoints: WorkflowNode[];

  constructor(name: string, description: string) {
    this.name = name;
    this.description = description;
    this.entrypoints = [];
  }

  public addEntrypoint(node: WorkflowNode) {
    this.entrypoints.push(node);
  }
}
