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
      let nextNode = new WorkflowNode(node.nodeId, node.config);
      nextNode = await this.recursiveEntrypointSetup(nextNode);
      nexts.push(nextNode);
    }

    initial.next = nexts;
    return initial;
  }

  async onModuleInit(): Promise<void> {
    const dbWorkflows = await this._prismaService.workflow.findMany({
      include: {
        entrypoints: true,
      },
    });

    for (const dbWorkflow of dbWorkflows) {
      const workflow = new Workflow(dbWorkflow.name, dbWorkflow.description);
      workflow.id = dbWorkflow.id;
      workflow.owner = dbWorkflow.ownerId;

      for (const dbEntrypoint of dbWorkflow.entrypoints) {
        let entrypoint = new WorkflowNode(
          dbEntrypoint.nodeId,
          dbEntrypoint.config,
        );

        entrypoint = await this.recursiveEntrypointSetup(entrypoint);

        workflow.addEntrypoint(entrypoint);
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
          if (!triggerNode && false) {
            // TODO fetch the service and check if it uses cron
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

    for (const entrypoint of workflow.entrypoints) {
      const found = this.recursiveFindNode(entrypoint, nodeId);
      if (found) {
        return found;
      }
    }
  }

  public runNode(nodeId: number, data: any) {
    const workflow = this.workflows.find((workflow) =>
      workflow.entrypoints.some((node) => node.id === nodeId),
    );

    if (!workflow) {
      return;
    }

    const node = this.getNode(workflow.id, nodeId);
    if (!node) {
      return;
    }

    const owner = this._usersService.getUserById(workflow.owner);

    const action = this._servicesService.getAction(node.nodeID);

    if (!action) {
      return;
    }
    return action._run(data, {
      user: owner,
      _workflowId: workflow.id,
      _next: node.next.map((node) => node.nodeID),
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

    const node = new WorkflowNode(nodeId, config);
    node.id = dbNode.id;
    previousNode.addNext(node);
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
    predicate: (entrypoint: WorkflowNode) => boolean,
  ) {
    for (const workflow of this.workflows) {
      for (const entrypoint of workflow.entrypoints) {
        if (predicate(entrypoint)) {
          await this.runNode(entrypoint.nodeID, data);
        }
      }
    }
  }
}
