import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import {
  Workflow,
  WorkflowExecution,
  WorkflowExecutionTrace,
  WorkflowNode,
} from '../../types/workflow';
import { ServicesService } from '../services/services.service';
import { UsersService } from '../users/users.service';
import { Repository } from 'typeorm';
import { NodeType, Trigger } from '../../types/services';

@Injectable()
export class WorkflowsService implements OnModuleInit {
  @Inject(ServicesService)
  private _servicesService: ServicesService;

  @Inject(UsersService)
  private _usersService: UsersService;

  @Inject('WORKFLOW_REPOSITORY')
  private _workflowRepository: Repository<Workflow>;

  @Inject('WORKFLOW_NODE_REPOSITORY')
  private _workflowNodeRepository: Repository<WorkflowNode>;

  @Inject('WORKFLOW_EXECUTION_REPOSITORY')
  private _workflowExecutionRepository: Repository<WorkflowExecution>;

  @Inject('WORKFLOW_EXECUTION_TRACE_REPOSITORY')
  private _workflowExecutionTraceRepository: Repository<WorkflowExecutionTrace>;

  workflows: Workflow[] = [];

  private async recursiveEntrypointSetup(
    initial: WorkflowNode,
  ): Promise<WorkflowNode> {
    const next = await this._workflowNodeRepository.find({
      where: {
        previous: {
          id: initial.id,
        },
      },
      relations: ['node'],
    });

    const nexts = [];

    for (const node of next) {
      let nextNode = new WorkflowNode(node.id, node.config);
      nextNode.node = node.node;
      nextNode = await this.recursiveEntrypointSetup(nextNode);
      nexts.push(nextNode);
    }

    initial.next = nexts;
    return initial;
  }

  async onModuleInit(): Promise<void> {
    const dbWorkflows = await this._workflowRepository.find({
      relations: ['owner', 'nodes', 'nodes.node'],
    });

    for (const dbWorkflow of dbWorkflows) {
      const workflow = new Workflow(dbWorkflow.name, dbWorkflow.description);
      workflow.id = dbWorkflow.id;
      workflow.owner = dbWorkflow.owner;

      for (const node of dbWorkflow.nodes) {
        if (node.node.type === NodeType.ACTION) {
          continue;
        }
        let entrypoint = new WorkflowNode(node.id, node.config);
        entrypoint.node = node.node;

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
        for (const entrypoint of workflow.entrypoints) {
          const triggerNode = entrypoint.node as Trigger;
          if (!triggerNode) {
            continue;
          }
          const service = this._servicesService.getServiceFromNode(
            triggerNode.id,
          );
          if (!service || !service.needCron()) {
            continue;
          }

          const shouldRun = await triggerNode.isTriggered(
            workflow.owner,
            entrypoint.config,
          );

          if (shouldRun) {
            const execution = new WorkflowExecution(workflow);
            await triggerNode._run(
              {},
              {
                ...entrypoint.config,
                user: workflow.owner,
                _workflowId: workflow.id,
                _next: entrypoint.next.map((node) => node.id) || [],
              },
              execution,
              null,
            );
            await this.saveExecution(execution);
          }
        }
      }
    }, 1000);
  }

  private async saveExecution(execution: WorkflowExecution) {
    const trace = execution.trace;
    const recursiveSave = async (node: WorkflowExecutionTrace) => {
      const saved = await this._workflowExecutionTraceRepository.insert(node);
      for (const next of node.next || []) {
        await recursiveSave(next);
      }
      return saved;
    };
    const r = await recursiveSave(trace);
    execution.firstTraceId = r.identifiers[0].id;
    const e = this._workflowExecutionRepository.create(execution);
    await this._workflowExecutionRepository.insert(e);
  }

  public getWorkflowByName(name: string): Workflow | undefined {
    return this.workflows.find((workflow) => workflow.name === name);
  }

  public listWorkflows(userId: number): Workflow[] {
    return this.workflows.filter((workflow) => workflow.owner.id === userId);
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

  public async runNode(
    nodeId: number,
    data: any,
    execution: WorkflowExecution,
    parentTraceUUID: string | null,
  ) {
    const workflow = this.workflows.find(
      (workflow) =>
        workflow.entrypoints.some((node) => node.id === nodeId) ||
        workflow.nodes.some((node) => node.id === nodeId),
    );

    if (!workflow) {
      console.error('No workflow found for node', nodeId);
      return;
    }

    const workflowNode = this.getNode(workflow.id, nodeId);
    if (!workflowNode) {
      console.error('No node found for id', nodeId);
      return;
    }

    const action = this._servicesService.getNode(workflowNode.node.id);

    if (!action) {
      console.error('No action found for node', workflowNode.node.id);
      return;
    }
    return action._run(
      data,
      {
        user: workflow.owner,
        _workflowId: workflow.id,
        _next: workflowNode.next.map((node) => node.id) || [],
        ...workflowNode.config,
      },
      execution,
      parentTraceUUID,
    );
  }

  public async getWorkflow(workflowId: number): Promise<Workflow | undefined> {
    return this.workflows.find((workflow) => workflow.id === workflowId);
  }

  public async deleteWorkflow(workflowId: number): Promise<void> {
    const workflow = this.workflows.find(
      (workflow) => workflow.id === workflowId,
    );

    if (!workflow) {
      return;
    }

    const dbWorkflow = await this._workflowRepository.delete({
      id: workflowId,
    });

    if (!dbWorkflow) {
      return;
    }

    this.workflows = this.workflows.filter(
      (workflow) => workflow.id !== workflowId,
    );
  }

  public async updateWorkflow(
    workflowId: number,
    data: Partial<Omit<Workflow, 'id'>>,
  ): Promise<void> {
    const workflow = this.workflows.find(
      (workflow) => workflow.id === workflowId,
    );

    if (!workflow) {
      return;
    }

    const dbWorkflow = await this._workflowRepository.update(
      {
        id: workflowId,
      },
      data,
    );

    if (!dbWorkflow) {
      return;
    }

    workflow.name = data.name || workflow.name;
    workflow.description = data.description || workflow.description;
  }

  public async createWorkflow(
    name: string,
    description: string,
    userId: number,
  ): Promise<void> {
    const workflow = new Workflow(name, description);

    const workflowId = (
      await this._workflowRepository.save({
        name,
        description,
        owner: {
          id: userId,
        },
      })
    ).id;

    const dbWorkflow = await this._workflowRepository.findOne({
      where: { id: workflowId },
      relations: ['owner'],
    });

    if (!dbWorkflow) {
      return;
    }

    workflow.id = dbWorkflow.id;
    workflow.owner = dbWorkflow.owner;
    this.workflows.push(workflow);
  }

  public async getNodes(workflowId: number): Promise<WorkflowNode[]> {
    const workflow = this.workflows.find(
      (workflow) => workflow.id === workflowId,
    );

    if (!workflow) {
      return [];
    }

    return workflow.nodes;
  }

  public async deleteNode(workflowId: number, nodeId: number): Promise<void> {
    const workflow = this.workflows.find(
      (workflow) => workflow.id === workflowId,
    );

    if (!workflow) {
      return;
    }

    const node = this.getNode(workflowId, nodeId);

    if (!node) {
      return;
    }

    const dbNode = await this._workflowNodeRepository.delete({
      id: nodeId,
    });

    if (!dbNode) {
      return;
    }

    workflow.nodes = workflow.nodes.filter((node) => node.id !== nodeId);
  }

  public async updateNode(
    workflowId: number,
    nodeId: number,
    config: any,
  ): Promise<void> {
    const workflow = this.workflows.find(
      (workflow) => workflow.id === workflowId,
    );

    if (!workflow) {
      return;
    }

    const node = this.getNode(workflowId, nodeId);

    if (!node) {
      return;
    }

    const dbNode = await this._workflowNodeRepository.update(
      {
        id: nodeId,
      },
      {
        config,
      },
    );

    if (!dbNode) {
      return;
    }

    node.config = config;
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

    const dbNode = await this._workflowNodeRepository.save({
      node: {
        id: nodeId,
      },
      config,
    });

    if (!dbNode) {
      return;
    }

    const node = new WorkflowNode(dbNode.id, config);
    node.node = this._servicesService.getNode(nodeId);
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

    const dbNode = await this._workflowNodeRepository.save({
      node: {
        id: nodeId,
      },
      config,
    });

    if (!dbNode) {
      return;
    }

    const node = new WorkflowNode(nodeId, config);
    node.id = dbNode.id;
    workflow.addEntrypoint(node);
  }

  public async findAndTriggerGlobal(data: any, nodeID: number) {
    for (const workflow of this.workflows) {
      for (const node of workflow.entrypoints) {
        if (node.node.id === nodeID) {
          const triggerNode = this._servicesService.getTrigger(nodeID);
          if (!triggerNode) {
            continue;
          }
          const shouldRun = await triggerNode.isTriggered(
            workflow.owner,
            node.config,
            data,
          );
          if (!shouldRun) {
            continue;
          }
          const execution = new WorkflowExecution(workflow);
          await this.runNode(node.id, data, execution, null);
          await this.saveExecution(execution);
        }
      }
    }
  }

  public getServices(): ServicesService {
    return this._servicesService;
  }
}
