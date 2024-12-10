import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../providers/prisma/prisma.service';
import { Workflow, WorkflowNode } from '../../types/workflow/workflow.type';
import { AuthContext } from '../auth/auth.context';
import { ServicesService } from '../services/services.service';
import { UsersService } from '../users/users.service';
import { IdOf, Node } from '../../types';

@Injectable()
export class WorkflowsService implements OnModuleInit {
  @Inject(PrismaService)
  private _prismaService: PrismaService;

  @Inject(AuthContext)
  private _authContext: AuthContext;

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
          if (
            !triggerNode ||
            triggerNode.service === null ||
            !triggerNode.service.serviceMetadata.useCron
          ) {
            continue;
          }

          const shouldRun = triggerNode.isTriggered(owner, entrypoint.config);

          if (shouldRun) {
            triggerNode.trigger(
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
    if (!this._authContext.authenticated) {
      return undefined;
    }
    return this.workflows.find(
      (workflow) =>
        workflow.name === name && workflow.owner === this._authContext.user.id,
    );
  }

  public listWorkflows(): Workflow[] {
    if (!this._authContext.authenticated) {
      return [];
    }

    return this.workflows.filter(
      (workflow) => workflow.owner === this._authContext.user.id,
    );
  }

  private recursiveFindNode(
    node: WorkflowNode,
    nodeId: IdOf<WorkflowNode>,
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

  public getNode(
    workflowId: IdOf<Workflow>,
    nodeId: IdOf<WorkflowNode>,
  ): WorkflowNode | undefined {
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

  public runNode(nodeId: IdOf<WorkflowNode>, data: any) {
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
    return action.execute(data, {
      user: owner,
      _workflowId: workflow.id,
      _next: node.next.map((node) => node.nodeID),
    });
  }

  public async createWorkflow(
    name: string,
    description: string,
  ): Promise<void> {
    if (!this._authContext.authenticated) {
      return;
    }

    const workflow = new Workflow(name, description);
    workflow.owner = this._authContext.user.id;

    const dbWorkflow = await this._prismaService.workflow.create({
      data: {
        name,
        description,
        ownerId: this._authContext.user.id,
      },
    });

    if (!dbWorkflow) {
      return;
    }

    workflow.id = dbWorkflow.id;
    this.workflows.push(workflow);
  }

  public async addNodeToWorkflow(
    nodeId: IdOf<Node>,
    workflowId: IdOf<Workflow>,
    previousNodeId: IdOf<WorkflowNode>,
    config: any,
  ): Promise<void> {
    if (!this._authContext.authenticated) {
      return;
    }

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
    nodeId: IdOf<Node>,
    workflowId: IdOf<Workflow>,
    config: any,
  ): Promise<void> {
    if (!this._authContext.authenticated) {
      return;
    }

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
}
