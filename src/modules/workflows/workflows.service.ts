import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../providers/prisma/prisma.service';
import { Workflow, WorkflowNode } from '../../types/workflow';
import { ServicesService } from '../services/services.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class WorkflowsService implements OnModuleInit {
  @Inject(PrismaService)
  private _prismaService: PrismaService;

  @Inject(ServicesService)
  private _servicesService: ServicesService;

  @Inject(UsersService)
  private _usersService: UsersService;

  workflows: Workflow[] = [];

  private async recursiveEntrypointSetup(
    initial: WorkflowNode,
  ): Promise<WorkflowNode> {
    const next = await this._prismaService.workflowNode.findMany({
      where: {
        previousNodes: {
          some: {
            id: initial.id,
          },
        },
      },
    });

    const nexts = [];

    for (const node of next) {
      let nextNode = new WorkflowNode(node.id, node.config);
      nextNode.nodeID = node.nodeId;
      nextNode = await this.recursiveEntrypointSetup(nextNode);
      nexts.push(nextNode);
    }

    initial.next = nexts;
    return initial;
  }

  async onModuleInit(): Promise<void> {
    const dbWorkflows = await this._prismaService.workflow.findMany({
      include: {
        nodes: {
          include: {
            previousNodes: true,
            node: true,
          },
        },
      },
    });

    for (const dbWorkflow of dbWorkflows) {
      const workflow = new Workflow(dbWorkflow.name, dbWorkflow.description);
      workflow.id = dbWorkflow.id;
      workflow.owner = dbWorkflow.ownerId;

      for (const node of dbWorkflow.nodes) {
        if (node.previousNodes.length > 0 || node.node.type === 'ACTION') {
          continue;
        }
        let entrypoint = new WorkflowNode(node.id, node.config);
        entrypoint.nodeID = node.nodeId;

        entrypoint = await this.recursiveEntrypointSetup(entrypoint);

        workflow.addEntrypoint(entrypoint);
      }

      let nodes = workflow.entrypoints.map((node) => node.next).flat();
      nodes = nodes.filter(
        (node, index, self) =>
          index === self.findIndex((t) => t.id === node.id),
      );

      for (const node of nodes) {
        workflow.addNode(node);
      }

      this.workflows.push(workflow);
    }

    setInterval(async () => {
      for (const workflow of this.workflows) {
        const owner = await this._usersService.getUserById(workflow.owner);
        for (const entrypoint of workflow.entrypoints) {
          const triggerNode = this._servicesService.getTrigger(
            entrypoint.nodeID,
          );
          if (!triggerNode) {
            continue;
          }
          const service = this._servicesService.getServiceFromNode(
            entrypoint.nodeID,
          );
          if (!service || !service.needCron()) {
            continue;
          }

          const shouldRun = triggerNode.isTriggered(owner, entrypoint.config);

          if (shouldRun) {
            await triggerNode._run(
              {},
              {
                ...entrypoint.config,
                user: owner,
                _workflowId: workflow.id,
                _next: entrypoint.next.map((node) => node.nodeID),
              },
            );
          }
        }
      }
    }, 1000);
  }

  public getWorkflowByName(name: string): Workflow | undefined {
    return this.workflows.find((workflow) => workflow.name === name);
  }

  public listWorkflows(userId: number): Workflow[] {
    return this.workflows.filter((workflow) => workflow.owner === userId);
  }

  private recursiveFindNode(
    node: WorkflowNode,
    nodeId: number,
  ): WorkflowNode | undefined {
    if (node.id === nodeId) {
      return node;
    }

    for (const next of node.next) {
      const found = this.recursiveFindNode(next, nodeId);
      if (found) {
        return found;
      }
    }

    return undefined;
  }

  public getNode(workflowId: number, nodeId: number): WorkflowNode | undefined {
    const workflow = this.workflows.find(
      (workflow) => workflow.id === workflowId,
    );
    if (!workflow) {
      return undefined;
    }

    for (const node of workflow.entrypoints) {
      const found = this.recursiveFindNode(node, nodeId);
      if (found) {
        return found;
      }
    }
  }

  public runNode(nodeId: number, data: any) {
    const workflow = this.workflows.find(
      (workflow) =>
        workflow.entrypoints.some((node) => node.id === nodeId) ||
        workflow.nodes.some((node) => node.id === nodeId),
    );

    if (!workflow) {
      console.error('No workflow found for node', nodeId);
      return;
    }

    const node = this.getNode(workflow.id, nodeId);
    if (!node) {
      console.error('No node found for id', nodeId);
      return;
    }

    const owner = this._usersService.getUserById(workflow.owner);

    const action = this._servicesService.getNode(node.nodeID);

    if (!action) {
      console.error('No action found for node', node.nodeID);
      return;
    }
    return action._run(data, {
      user: owner,
      _workflowId: workflow.id,
      _next: node.next.map((node) => node.id),
    });
  }

  public async createWorkflow(
    name: string,
    description: string,
    userId: number,
  ): Promise<void> {
    const workflow = new Workflow(name, description);
    workflow.owner = userId;

    const dbWorkflow = await this._prismaService.workflow.create({
      data: {
        name,
        description,
        ownerId: userId,
      },
    });

    if (!dbWorkflow) {
      return;
    }

    workflow.id = dbWorkflow.id;
    this.workflows.push(workflow);
  }

  public async addNodeToWorkflow(
    nodeId: number,
    workflowId: number,
    previousNodeId: number,
    config: any,
  ): Promise<void> {
    const workflow = this.workflows.find(
      (workflow) => workflow.id === workflowId,
    );

    if (!workflow) {
      return;
    }

    const previousNode = this.getNode(workflowId, previousNodeId);

    if (!previousNode) {
      return;
    }

    const dbNode = await this._prismaService.workflowNode.create({
      data: {
        nodeId,
        workflowId,
        previousNodes: {
          connect: {
            id: previousNodeId,
          },
        },
        config,
      },
    });

    if (!dbNode) {
      return;
    }

    const node = new WorkflowNode(dbNode.id, config);
    node.nodeID = dbNode.nodeId;
    previousNode.addNext(node);
    workflow.addNode(node);
  }

  public async addEntrypointToWorkflow(
    nodeId: number,
    workflowId: number,
    config: any,
  ): Promise<void> {
    const workflow = this.workflows.find(
      (workflow) => workflow.id === workflowId,
    );

    if (!workflow) {
      return;
    }

    const dbNode = await this._prismaService.workflowNode.create({
      data: {
        nodeId,
        workflowId,
        config,
      },
    });

    if (!dbNode) {
      return;
    }

    const node = new WorkflowNode(nodeId, config);
    node.id = dbNode.id;
    workflow.addEntrypoint(node);
  }

  public async findAndTrigger(
    data: any,
    predicate: (node: WorkflowNode) => boolean,
  ) {
    for (const workflow of this.workflows) {
      for (const node of workflow.entrypoints) {
        if (predicate(node)) {
          await this.runNode(node.id, data);
        }
      }
    }
  }
}
