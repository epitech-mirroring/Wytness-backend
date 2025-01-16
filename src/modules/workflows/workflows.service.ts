import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import {
  Workflow,
  WorkflowBasicInfo,
  WorkflowExecution,
  WorkflowExecutionTrace,
  WorkflowNode,
  WorkflowNodeNext,
  WorkflowStatus,
} from '../../types/workflow';
import { ServicesService } from '../services/services.service';
import { UsersService } from '../users/users.service';
import { Repository } from 'typeorm';
import { MinimalConfig, NodeType, Trigger } from '../../types/services';
import { PermissionsService } from '../permissions/permissions.service';
import { User } from '../../types/user';
import { ListOptions } from '../../types/global';

@Injectable()
export class WorkflowsService implements OnModuleInit {
  @Inject(ServicesService)
  private _servicesService: ServicesService;

  @Inject(PermissionsService)
  private _permissionsService: PermissionsService;

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

  @Inject('WORKFLOW_NODE_NEXT_REPOSITORY')
  private _workflowNodeNextRepository: Repository<WorkflowNodeNext>;

  workflows: Workflow[] = [];

  private async recursiveEntrypointSetup(
    initial: WorkflowNode,
  ): Promise<WorkflowNode> {
    const dbNext = await this._workflowNodeNextRepository.find({
      where: { parent: { id: initial.id } },
      relations: [
        'next',
        'next.previous',
        'next',
        'next.node',
        'next.node.service',
      ],
    });

    const builtNext = [];

    for (const next of dbNext) {
      const nextNodes = [];
      const label = next.label;
      for (const node of next.next) {
        let nextNode = new WorkflowNode(node.id, node.config);
        nextNode.node = node.node;
        nextNode.previous = node.previous;
        nextNode.position = node.position;
        nextNode = await this.recursiveEntrypointSetup(nextNode);
        nextNodes.push(nextNode);
      }
      builtNext.push({
        label,
        next: nextNodes,
      });
    }

    initial.next = builtNext;
    return initial;
  }

  async onModuleInit(): Promise<void> {
    const globalPolicy = await this._permissionsService.createPolicy('User');

    await this._permissionsService.addRuleToPolicy<Workflow>(
      globalPolicy,
      'read',
      Workflow,
      (user, resource) => {
        return user.id === resource.owner.id;
      },
      'allow',
    );

    await this._permissionsService.addRuleToPolicy<Workflow>(
      globalPolicy,
      'delete',
      Workflow,
      (user, resource) => {
        return user.id === resource.owner.id;
      },
      'allow',
    );

    await this._permissionsService.addRuleToPolicy<Workflow>(
      globalPolicy,
      'update',
      Workflow,
      (user, resource) => {
        return user.id === resource.owner.id;
      },
      'allow',
    );

    await this._permissionsService.addRuleToPolicy<Workflow>(
      globalPolicy,
      'create',
      Workflow,
      () => {
        return true;
      },
      'allow',
    );

    const dbWorkflows = await this._workflowRepository.find({
      relations: [
        'owner',
        'nodes',
        'nodes.node',
        'nodes.previous',
        'nodes.previous.parent',
        'nodes.node.service',
      ],
    });

    for (const dbWorkflow of dbWorkflows) {
      const workflow = new Workflow(dbWorkflow.name, dbWorkflow.description);
      workflow.id = dbWorkflow.id;
      workflow.owner = dbWorkflow.owner;
      workflow.status = dbWorkflow.status;

      const nodes = [];
      for (const node of dbWorkflow.nodes) {
        if (node.node.type === NodeType.ACTION) {
          if (!node.previous) {
            nodes.push(node);
          }
          continue;
        }
        let entrypoint = new WorkflowNode(node.id, node.config);
        entrypoint.node = node.node;
        entrypoint.position = node.position;

        entrypoint = await this.recursiveEntrypointSetup(entrypoint);
        nodes.push(entrypoint);
      }

      const recursiveNodeSetup = async (node: WorkflowNode) => {
        if (!node.next) {
          node.next = [];
        }
        for (const next of node.next) {
          for (const nextNode of next.next) {
            nodes.push(nextNode);
            await recursiveNodeSetup(nextNode);
          }
        }
      };
      for (const node of nodes) {
        await recursiveNodeSetup(node);
      }
      for (const node of nodes) {
        workflow.addNode(node);
      }

      this.workflows.push(workflow);
    }

    setInterval(async () => {
      workflow: for (const workflow of this.workflows) {
        for (const entrypoint of workflow.entrypoints) {
          const triggerNode = entrypoint.node as Trigger;
          if (!triggerNode) {
            continue;
          }
          if (workflow.status !== WorkflowStatus.ENABLED) {
            continue workflow;
          }
          const service = this._servicesService.getServiceFromNode(
            triggerNode.id,
          );
          if (!service || !service.needCron()) {
            continue;
          }

          for (const label of triggerNode.labels) {
            const shouldRun = await triggerNode.isTriggered(
              label,
              workflow.owner,
              entrypoint.config,
            );

            if (shouldRun) {
              const execution = new WorkflowExecution(workflow);
              const nexts: { [key: string]: number[] } = {};
              for (const next of entrypoint.next) {
                nexts[next.label] = next.next.map((node) => node.id);
              }
              await triggerNode._run(
                label,
                {},
                {
                  ...entrypoint.config,
                  user: workflow.owner,
                  _workflowId: workflow.id,
                  _next: nexts,
                } as MinimalConfig & any,
                execution,
                null,
              );
              await this.saveExecution(execution);
            }
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

  public async listWorkflows(
    performer: User,
    options?: ListOptions,
  ): Promise<WorkflowBasicInfo[]> {
    let authorizedWorkflows = [];

    for (const workflow of this.workflows) {
      const authorizedWorkflow = await this.getWorkflow(performer, workflow.id);
      if (authorizedWorkflow) {
        authorizedWorkflows.push(authorizedWorkflow);
      }
    }

    if (options) {
      authorizedWorkflows = await Promise.all(
        authorizedWorkflows.map(async (workflow) => {
          workflow.__executions = await this._workflowExecutionRepository.find({
            where: { workflow: { id: workflow.id } },
          });
          return workflow;
        }),
      );

      if ('timeframe' in options) {
        if ('start' in options.timeframe) {
          authorizedWorkflows = authorizedWorkflows.filter(
            (workflow) =>
              workflow.__executions.filter(
                (execution: WorkflowExecution) =>
                  execution.statistics.duration.start >=
                  options.timeframe.start,
              ).length > 0,
          );
        }
        if ('end' in options.timeframe) {
          authorizedWorkflows = authorizedWorkflows.filter(
            (workflow) =>
              workflow.__executions.filter(
                (execution: WorkflowExecution) =>
                  execution.statistics.duration.end <= options.timeframe.end,
              ).length > 0,
          );
        }
      }

      if ('sort' in options) {
        const sort = options.order === 'ASC' ? 1 : -1;
        const getStat = (execution: Workflow, stat: string) => {
          const path = stat.split('.');
          let current = execution;
          for (const p of path) {
            if (!current[p]) {
              return 0;
            }
            current = current[p];
          }

          if (typeof current === 'string') {
            if (current === 'COMPLETED') {
              return 1;
            }
            if (current === 'FAILED') {
              return -1;
            }
            if (!isNaN(parseFloat(current))) {
              return parseFloat(current);
            }
            return 0;
          } else {
            if (current instanceof Date) {
              return current.getTime();
            }
            if (typeof current === 'object') {
              return Object.keys(current).length;
            }
            return 0;
          }
        };
        authorizedWorkflows = authorizedWorkflows.map((workflow) => {
          workflow.__executions = workflow.__executions.sort((a, b) => {
            const aStat = getStat(a, options.sort);
            const bStat = getStat(b, options.sort);
            if (aStat > bStat) {
              return sort;
            }
            if (aStat < bStat) {
              return -sort;
            }
            return 0;
          });
          return workflow;
        });

        authorizedWorkflows = authorizedWorkflows.sort((a, b) => {
          const aStat = a.__executions[0]
            ? getStat(a.__executions[0], options.sort)
            : 0;
          const bStat = b.__executions[0]
            ? getStat(b.__executions[0], options.sort)
            : 0;
          if (aStat > bStat) {
            return sort;
          }
          if (aStat < bStat) {
            return -sort;
          }
          return 0;
        });
      }

      if ('offset' in options) {
        authorizedWorkflows = authorizedWorkflows.slice(options.offset);
      }

      if ('limit' in options) {
        authorizedWorkflows = authorizedWorkflows.slice(0, options.limit);
      }

      authorizedWorkflows = authorizedWorkflows.map((workflow) => {
        delete workflow.__executions;
        return workflow;
      });
    }

    return authorizedWorkflows;
  }

  private recursiveFindNode(
    node: WorkflowNode,
    nodeId: number,
  ): WorkflowNode | undefined {
    if (node.id === nodeId) {
      return node;
    }
    if (!node.next) {
      node.next = [];
    }

    for (const next of node.next) {
      for (const n of next.next) {
        const found = this.recursiveFindNode(n, nodeId);
        if (found) {
          return found;
        }
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
    for (const node of workflow.strandedNodes) {
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
    for (const label of action.labels) {
      const nexts: { [key: string]: number[] } = {};
      for (const next of workflowNode.next) {
        nexts[next.label] = next.next.map((node) => node.id);
      }
      await action._run(
        label,
        data,
        {
          user: workflow.owner,
          _workflowId: workflow.id,
          _next: nexts,
          ...workflowNode.config,
        },
        execution,
        parentTraceUUID,
      );
    }
  }

  public async workflowToJsonObject(workflow: Workflow): Promise<any> {
    const services = [];
    const recursiveServiceSetup = async (node: WorkflowNode) => {
      services.push(node.node.service.name);
      for (const next of node.next) {
        for (const nextNode of next.next) {
          await recursiveServiceSetup(nextNode);
        }
      }
    };
    for (const node of workflow.entrypoints) {
      await recursiveServiceSetup(node);
    }
    for (const node of workflow.strandedNodes) {
      await recursiveServiceSetup(node);
    }

    return {
      id: workflow.id,
      name: workflow.name,
      description: workflow.description,
      ownerId: workflow.owner.id,
      serviceUsed: services.filter((v, i, a) => a.indexOf(v) === i),
      status: workflow.status,
    } as WorkflowBasicInfo;
  }

  public async getWorkflow(
    performer: User,
    workflowId: number,
  ): Promise<WorkflowBasicInfo | undefined> {
    const workflow = this.workflows.find(
      (workflow) => workflow.id === workflowId,
    );

    if (!workflow) {
      return;
    }

    if (
      !(await this._permissionsService.can(
        performer,
        'read',
        workflow.id,
        Workflow,
      ))
    ) {
      return;
    }
    const ownerId = await this._permissionsService.can(
      performer,
      'read',
      workflow.owner.id,
      User,
    );

    if (!ownerId) {
      return;
    }

    return this.workflowToJsonObject(workflow);
  }

  public async deleteWorkflow(
    performer: User,
    workflowId: number,
  ): Promise<boolean> {
    const workflow = this.workflows.find(
      (workflow) => workflow.id === workflowId,
    );

    if (!workflow) {
      return false;
    }

    if (
      !(await this._permissionsService.can(
        performer,
        'delete',
        workflow.id,
        Workflow,
      ))
    ) {
      return false;
    }

    const executions = await this._workflowExecutionRepository.find({
      where: { workflow: { id: workflowId } },
    });

    for (const execution of executions) {
      await this._workflowExecutionTraceRepository.delete({
        id: execution.firstTraceId,
      });
    }

    await this._workflowNodeRepository.delete({ workflow: { id: workflowId } });

    const dbWorkflow = await this._workflowRepository.delete({
      id: workflowId,
    });

    if (!dbWorkflow) {
      return false;
    }

    this.workflows = this.workflows.filter(
      (workflow) => workflow.id !== workflowId,
    );
    return true;
  }

  public async updateWorkflow(
    performer: User,
    workflowId: number,
    status: string,
    name: string,
    description: string,
  ): Promise<Workflow | { error: string }> {
    const workflow = this.workflows.find(
      (workflow) => workflow.id === workflowId,
    );

    if (!workflow) {
      return { error: 'Workflow not found' };
    }

    if (
      !(await this._permissionsService.can(
        performer,
        'update',
        workflow.id,
        Workflow,
      ))
    ) {
      return { error: 'Permission denied' };
    }

    let statusToUpdate: WorkflowStatus | undefined;

    switch (status) {
      case 'enabled':
        statusToUpdate = WorkflowStatus.ENABLED;
        break;
      case 'disabled':
        statusToUpdate = WorkflowStatus.DISABLED;
        break;
      case 'error':
        statusToUpdate = WorkflowStatus.ERROR;
        break;
      default:
        statusToUpdate = undefined;
    }

    const dbWorkflow = await this._workflowRepository.update(
      {
        id: workflowId,
      },
      {
        name,
        description,
        status: statusToUpdate ? statusToUpdate : workflow.status,
      },
    );

    if (!dbWorkflow) {
      return { error: 'Could not update workflow' };
    }

    workflow.name = name || workflow.name;
    workflow.description = description || workflow.description;
    workflow.status = statusToUpdate ? statusToUpdate : workflow.status;
    return workflow;
  }

  public async createWorkflow(
    performer: User,
    name: string,
    description: string,
  ): Promise<Workflow | { error: string }> {
    if (
      !(await this._permissionsService.can(performer, 'create', null, Workflow))
    ) {
      return { error: 'Permission denied' };
    }
    const workflow = new Workflow(name, description);
    const workflowId = (
      await this._workflowRepository.save({
        name,
        description,
        owner: {
          id: performer.id,
        },
      })
    ).id;

    const dbWorkflow = await this._workflowRepository.findOne({
      where: { id: workflowId },
      relations: ['owner'],
    });

    if (!dbWorkflow) {
      return { error: 'Could not save workflow' };
    }

    workflow.id = dbWorkflow.id;
    workflow.owner = dbWorkflow.owner;
    workflow.status = dbWorkflow.status;
    this.workflows.push(workflow);
    return workflow;
  }

  public nodeToJsonObject(node: WorkflowNode): any {
    return {
      id: node.id,
      config: node.config,
      node: {
        name: node.node.name,
        description: node.node.description,
        labels: node.node.labels,
        type: node.node.type,
        id: node.node.id,
      },
      next: (node.next ? node.next : []).map((next) => {
        return {
          label: next.label,
          next: next.next.map((node) => this.nodeToJsonObject(node)),
        };
      }),
      position: node.position,
    };
  }

  public async getNodes(
    performer: User,
    workflowId: number,
  ): Promise<WorkflowNode[]> {
    const workflow = this.workflows.find(
      (workflow) => workflow.id === workflowId,
    );

    if (!workflow) {
      return undefined;
    }

    if (
      !(await this._permissionsService.can(
        performer,
        'read',
        workflow.id,
        Workflow,
      ))
    ) {
      return undefined;
    }

    const flattenNodes = (nodes: WorkflowNode[]): WorkflowNode[] => {
      const flatNodes = [];
      for (const node of nodes) {
        flatNodes.push(this.nodeToJsonObject(node));
      }
      return flatNodes;
    };

    const nodes = flattenNodes(workflow.entrypoints);
    nodes.push(...flattenNodes(workflow.strandedNodes));
    return nodes;
  }

  public async deleteNode(
    performer: User,
    workflowId: number,
    nodeId: number,
  ): Promise<boolean> {
    const workflow = this.workflows.find(
      (workflow) => workflow.id === workflowId,
    );

    if (!workflow) {
      return false;
    }

    if (
      !(await this._permissionsService.can(
        performer,
        'update',
        workflow.id,
        Workflow,
      ))
    ) {
      return false;
    }

    const node = this.getNode(workflowId, nodeId);

    if (!node) {
      return false;
    }

    const dbNode = await this._workflowNodeRepository.delete({
      id: nodeId,
    });

    if (!dbNode) {
      return false;
    }

    const dbNext = await this._workflowNodeNextRepository.find({
      where: { parent: { id: nodeId } },
    });

    for (const next of dbNext) {
      await this._workflowNodeNextRepository.delete({ id: next.id });
    }

    workflow.nodes = workflow.nodes.filter((node) => node.id !== nodeId);
    workflow.entrypoints = workflow.entrypoints.filter(
      (node) => node.id !== nodeId,
    );
    if (node.next.length > 0) {
      for (const nextNode of node.next) {
        for (const next of nextNode.next) {
          workflow.strandedNodes.push(next);
          workflow.nodes = workflow.nodes.filter((node) => node.id !== next.id);
        }
      }
    }
    for (const entrypoint of workflow.entrypoints) {
      for (const next of entrypoint.next) {
        next.next = next.next.filter((node) => node.id !== nodeId);
      }
    }
    workflow.strandedNodes = workflow.strandedNodes.filter(
      (node) => node.id !== nodeId,
    );

    return true;
  }

  public async updateNode(
    performer: User,
    workflowId: number,
    nodeId: number,
    config?: any,
    previousNodeId?: number | null,
    label?: string,
    position?: { x: number; y: number },
  ): Promise<WorkflowNode | { error: string }> {
    const workflow = this.workflows.find(
      (workflow) => workflow.id === workflowId,
    );
    if (!workflow) {
      return { error: 'Workflow not found' };
    }

    if (
      !(await this._permissionsService.can(
        performer,
        'update',
        workflow.id,
        Workflow,
      ))
    ) {
      return { error: 'Permission denied' };
    }

    const node = this.getNode(workflowId, nodeId);

    if (!node) {
      return { error: 'Node not found' };
    }

    const oldLabel = node.previous ? node.previous.label : undefined;

    if (previousNodeId !== undefined || label) {
      //disconnect node from previous in RAM
      if (node.previous && node.previous.next) {
        node.previous.next = node.previous.next.filter((n) => n.id !== nodeId);
      }
      node.previous = null;

      //disconnect node from previous in DB
      await this._workflowNodeRepository.update(
        {
          id: nodeId,
        },
        {
          previous: null,
        },
      );
    }

    if (config) {
      await this._workflowNodeRepository.update(
        {
          id: nodeId,
        },
        {
          config,
        },
      );
      node.config = config;
    }

    if (previousNodeId || (label && previousNodeId)) {
      const labelA = label || oldLabel;
      const previous = this.getNode(workflowId, previousNodeId);
      if (!previous) {
        return { error: 'Previous node not found' };
      }
      if (!previous.node.labels.includes(labelA)) {
        return { error: 'Invalid label' };
      }
      previous.addNext(this.getNode(workflowId, nodeId), labelA);
      await this._workflowNodeRepository.update(
        {
          id: nodeId,
        },
        {
          previous: {
            id: previousNodeId,
            label: labelA,
          },
        },
      );
      node.previous = previous.next.find((n) => n.label === labelA);
    }

    if (position) {
      await this._workflowNodeRepository.update(
        {
          id: nodeId,
        },
        {
          position,
        },
      );
      node.position = position;
    }

    return node;
  }

  public async addNodeToWorkflow(
    performer: User,
    nodeId: number,
    workflowId: number,
    previousNodeId: number,
    previousNodeLabel: string,
    config: any,
    position?: { x: number; y: number },
  ): Promise<WorkflowNode | { error: string }> {
    const workflow = this.workflows.find(
      (workflow) => workflow.id === workflowId,
    );

    if (!workflow) {
      return { error: 'Workflow not found' };
    }
    const Tnode = this._servicesService.getNode(nodeId);
    if (!Tnode) {
      return { error: 'Node not found' };
    }
    if (
      (previousNodeId && !previousNodeLabel) ||
      (previousNodeLabel && !previousNodeId)
    ) {
      return { error: 'Previous node id and label must come together' };
    } else if (previousNodeId && Tnode.type === NodeType.TRIGGER) {
      return { error: 'Trigger nodes cannot have previous nodes' };
    }

    if (
      !(await this._permissionsService.can(
        performer,
        'update',
        workflow.id,
        Workflow,
      ))
    ) {
      return { error: 'Permission denied' };
    }

    const previousNode = previousNodeId
      ? this.getNode(workflowId, previousNodeId)
      : undefined;

    if (previousNodeId && !previousNode) {
      return { error: 'Previous node not found' };
    }

    let dbNode: WorkflowNode = await this._workflowNodeRepository.save({
      workflow: {
        id: workflowId,
      },
      node: {
        id: nodeId,
      },
      config,
      position: position || { x: 100, y: 100 },
    });
    if (!dbNode) {
      return { error: 'Could not save node' };
    }

    dbNode = await this._workflowNodeRepository.findOne({
      where: { id: dbNode.id },
      relations: ['node'],
    });

    for (const label of dbNode.node.labels) {
      await this._workflowNodeNextRepository.save({
        label,
        parent: {
          id: dbNode.id,
        },
        next: [],
      });
    }

    const node = new WorkflowNode(dbNode.id, config);
    node.node = this._servicesService.getNode(nodeId);
    node.position = dbNode.position;
    if (previousNode) {
      previousNode.addNext(node, previousNodeLabel);

      const dbNext = await this._workflowNodeNextRepository.findOne({
        where: { parent: { id: previousNodeId }, label: previousNodeLabel },
        relations: ['next', 'next.node'],
      });

      dbNext.next.push(dbNode);
      node.previous = dbNext;

      await this._workflowNodeNextRepository.save(dbNext);
    }
    workflow.addNode(node);
    return node;
  }

  public async findAndTriggerGlobal(data: any, nodeID: number) {
    workflow: for (const workflow of this.workflows) {
      for (const node of workflow.entrypoints) {
        if (node.node.id === nodeID) {
          const triggerNode = this._servicesService.getTrigger(nodeID);
          if (!triggerNode) {
            continue;
          }
          if (workflow.status !== WorkflowStatus.ENABLED) {
            continue workflow;
          }
          for (const label of triggerNode.labels) {
            const shouldRun = await triggerNode.isTriggered(
              label,
              workflow.owner,
              node.config,
              data,
            );
            if (shouldRun) {
              const execution = new WorkflowExecution(workflow);
              const nexts: { [key: string]: number[] } = {};
              for (const next of node.next) {
                nexts[next.label] = next.next.map((node) => node.id);
              }
              await triggerNode._run(
                label,
                data,
                {
                  user: workflow.owner,
                  _workflowId: workflow.id,
                  _next: nexts,
                  ...node.config,
                },
                execution,
                null,
              );
              await this.saveExecution(execution);
            }
          }
        }
      }
    }
  }

  public getServices(): ServicesService {
    return this._servicesService;
  }

  async getExecutions(performer: User, workflowId: number) {
    const workflow = this.workflows.find(
      (workflow) => workflow.id === workflowId,
    );

    if (!workflow) {
      return;
    }

    if (
      !(await this._permissionsService.can(
        performer,
        'read',
        workflow.id,
        Workflow,
      ))
    ) {
      return;
    }

    return await this._workflowExecutionRepository.find({
      where: { workflow: { id: workflowId } },
    });
  }
}
