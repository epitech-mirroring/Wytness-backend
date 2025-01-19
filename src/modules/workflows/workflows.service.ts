import { forwardRef, Inject, Injectable, OnModuleInit } from '@nestjs/common';
import {
  Workflow,
  WorkflowBasicInfo,
  WorkflowExecution,
  WorkflowNode,
  WorkflowStatus,
} from '../../types/workflow';
import { ServicesService } from '../services/services.service';
import { Repository } from 'typeorm';
import { PermissionsService } from '../permissions/permissions.service';
import { User } from '../../types/user';
import { ListOptions } from '../../types/global';
import { InjectRepository } from '@nestjs/typeorm';
import { ExecutionsService } from './executions.service';
import { NodesService } from './nodes.service';
import { NodeType } from '../../types/services';

@Injectable()
export class WorkflowsService implements OnModuleInit {
  @Inject(forwardRef(() => ServicesService))
  private _servicesService: ServicesService;

  @Inject(PermissionsService)
  private _permissionsService: PermissionsService;

  @InjectRepository(Workflow)
  private _workflowRepository: Repository<Workflow>;

  @Inject(forwardRef(() => ExecutionsService))
  private _executionService: ExecutionsService;

  @Inject(forwardRef(() => NodesService))
  private _nodesService: NodesService;

  private workflows: Workflow[] = [];

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

    setTimeout(async () => {
      const dbWorkflows = await this._workflowRepository.find();

      for (const dbWorkflow of dbWorkflows) {
        await this.loadWorkflow(dbWorkflow.id);
      }
    }, 1000);
  }

  public async loadWorkflow(workflowId: number): Promise<Workflow> {
    const workflow = await this._workflowRepository.findOne({
      where: { id: workflowId },
      relations: ['owner'],
    });

    if (!workflow) {
      return;
    }

    const parseWorkflowStatus = (status: string): WorkflowStatus => {
      return WorkflowStatus[
        status.toUpperCase() as keyof typeof WorkflowStatus
      ];
    };

    const newWorkflow = new Workflow(workflow.name, workflow.description);
    newWorkflow.id = workflow.id;
    newWorkflow.owner = workflow.owner;
    newWorkflow.status = parseWorkflowStatus(workflow.status);
    newWorkflow.nodes = [];
    newWorkflow.entrypoints = [];
    newWorkflow.strandedNodes = [];
    this.workflows.push(newWorkflow);

    await this.loadWorkflowNodes(newWorkflow);

    const needCron = newWorkflow.entrypoints.some(
      (node) => node.node.service.serviceMetadata.useCron,
    );
    if (needCron) {
      this._executionService.startCronForWorkflow(newWorkflow.id);
    }

    return newWorkflow;
  }

  public async loadWorkflowNodes(workflow: Workflow): Promise<void> {
    const workflowWithNodes = await this._workflowRepository.findOne({
      where: { id: workflow.id },
      relations: ['nodes', 'nodes.previous'],
    });

    if (!workflowWithNodes) {
      return;
    }

    const nodesWithNoPrevious = workflowWithNodes.nodes.filter(
      (node) => node.previous === null,
    );

    for (const node of nodesWithNoPrevious) {
      const workflowNode: WorkflowNode = await this._nodesService.loadNodeTree(
        node.id,
      );
      if (workflowNode.node.type === NodeType.TRIGGER) {
        workflow.entrypoints.push(workflowNode);
      } else {
        workflow.strandedNodes.push(workflowNode);
      }
      workflowNode.workflow = workflow;
      const recursiveAdd = (node: WorkflowNode, workflow: Workflow) => {
        for (const next of node.next) {
          for (const n of next.next) {
            n.workflow = workflow;
            workflow.nodes.push(n);
            recursiveAdd(n, workflow);
          }
        }
      };
      recursiveAdd(workflowNode, workflow);
      workflow.nodes.push(workflowNode);
    }
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
      const authorizedWorkflow = await this.getWorkflow(workflow.id, performer);
      if (authorizedWorkflow) {
        authorizedWorkflows.push(authorizedWorkflow);
      }
    }

    if (options) {
      authorizedWorkflows = await Promise.all(
        authorizedWorkflows.map(async (workflow) => {
          workflow.__executions = await this._executionService.getExecutions(
            performer,
            workflow.id,
          );
          if (!workflow.__executions) {
            workflow.__executions = [];
          }
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

  public async getWorkflow(
    workflowId: number,
    performer?: User,
  ): Promise<Workflow | undefined> {
    const workflow = this.workflows.find(
      (workflow) => workflow.id === workflowId,
    );

    if (!workflow) {
      return;
    }

    if (
      performer &&
      !(await this._permissionsService.can(
        performer,
        'read',
        workflow.id,
        Workflow,
      ))
    ) {
      return;
    }

    return workflow;
  }

  public async deleteWorkflow(
    performer: User,
    workflowId: number,
  ): Promise<boolean> {
    const workflow = await this.getWorkflow(workflowId, performer);

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

    const executions = await this._executionService.getExecutions(
      performer,
      workflowId,
    );

    for (const execution of executions) {
      await this._executionService.deleteExecution(performer, execution.id);
    }

    const deleteRecursive = async (node: WorkflowNode) => {
      for (const next of node.next) {
        for (const n of next.next) {
          await deleteRecursive(n);
        }
      }
      await this._nodesService.deleteNode(performer, workflowId, node.id);
    };

    for (const entrypoint of workflow.entrypoints) {
      await deleteRecursive(entrypoint);
    }

    for (const node of workflow.strandedNodes) {
      await deleteRecursive(node);
    }

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
    status?: string,
    name?: string,
    description?: string,
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
    if (status) {
      statusToUpdate =
        WorkflowStatus[status.toUpperCase() as keyof typeof WorkflowStatus];
      if (!statusToUpdate) {
        return { error: 'Invalid status' };
      }
    }

    const dbWorkflow = await this._workflowRepository.update(
      {
        id: workflowId,
      },
      {
        name: name ? name : workflow.name,
        description: description ? description : workflow.description,
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
    status?: string,
  ): Promise<Workflow | { error: string }> {
    if (
      !(await this._permissionsService.can(performer, 'create', null, Workflow))
    ) {
      return { error: 'Permission denied' };
    }
    let statusToUpdate: WorkflowStatus;
    if (status) {
      statusToUpdate =
        WorkflowStatus[status.toUpperCase() as keyof typeof WorkflowStatus];
    }
    const workflow = new Workflow(name, description, statusToUpdate);
    const workflowId = (
      await this._workflowRepository.save({
        name,
        description,
        owner: {
          id: performer.id,
        },
        status: statusToUpdate,
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
    workflow.nodes = [];
    workflow.entrypoints = [];
    workflow.strandedNodes = [];
    this.workflows.push(workflow);
    return workflow;
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

    const flattenNodes = (nodes: WorkflowNode[]): any[] => {
      const flatNodes = [];
      for (const node of nodes) {
        flatNodes.push(node.toJSON());
      }
      return flatNodes;
    };

    const nodes = flattenNodes(workflow.entrypoints);
    nodes.push(...flattenNodes(workflow.strandedNodes));
    return nodes;
  }

  public getServices(): ServicesService {
    return this._servicesService;
  }

  public getAll() {
    return this.workflows;
  }
}
