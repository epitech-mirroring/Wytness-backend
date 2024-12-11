export class WorkflowNode {
  id: number;
  nodeID: number;
  config: any;

  next: WorkflowNode[];

  constructor(id: number, config: any) {
    this.id = id;
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
  nodes: WorkflowNode[];

  constructor(name: string, description: string) {
    this.name = name;
    this.description = description;
    this.entrypoints = [];
    this.nodes = [];
  }

  public addEntrypoint(node: WorkflowNode) {
    this.entrypoints.push(node);
  }

  public addNode(node: WorkflowNode) {
    this.nodes.push(node);
  }
}
