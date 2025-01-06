import { ApiProperty } from '@nestjs/swagger';

export class WorkflowNode {
  @ApiProperty({
    description: 'The id of the Node',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'The nodeID of the Node (which is the id of the action or trigger)',
    example: 1,
  })
  nodeID: number;

  @ApiProperty({
    description: 'The config of the Node',
    example: {
      config: 'config',
    },
  })
  config: any;

  @ApiProperty({
    description: 'The list of next Nodes',
    example: [{
      "id": 6,
      "config": {},
      "nodeID": 3,
      "next": []
    }],
  })
  next: WorkflowNode[] = [];

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
  @ApiProperty({
    description: 'The id of the Workflow',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'The name of the Workflow',
    example: 'My Workflow',
  })
  name: string;

  @ApiProperty({
    description: 'The description of the Workflow',
    example: 'This is a description of the Workflow',
  })
  description: string;

  @ApiProperty({
    description: 'The owner of the Workflow',
    example: 1,
  })
  owner: number;

  @ApiProperty({
    description: 'The entrypoints of the Workflow',
    example: [{
      "id": 1,
      "config": {},
      "nodeID": 1,
      "next": []
    }],
  })
  entrypoints: WorkflowNode[];

  @ApiProperty({
    description: 'The nodes of the Workflow',
    example: [{
      "id": 1,
      "config": {},
      "nodeID": 1,
      "next": []
    }],
  })
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
