import { forwardRef, Inject, Injectable } from '@nestjs/common';
import {
  Workflow,
  WorkflowExecution,
  WorkflowExecutionTrace,
  WorkflowStatus,
} from '../../types/workflow';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkflowsService } from './workflows.service';
import { NodesService } from './nodes.service';
import { ServicesService } from '../services/services.service';
import { User } from '../../types/user';
import { PermissionsService } from '../permissions/permissions.service';
import { MinimalConfig, Trigger } from '../../types/services';

@Injectable()
export class ExecutionsService {
  @InjectRepository(WorkflowExecution)
  private _workflowExecutionRepository: Repository<WorkflowExecution>;

  @InjectRepository(WorkflowExecutionTrace)
  private _workflowExecutionTraceRepository: Repository<WorkflowExecutionTrace>;

  @Inject(forwardRef(() => WorkflowsService))
  private _workflowsService: WorkflowsService;

  @Inject(forwardRef(() => NodesService))
  private _nodesService: NodesService;

  @Inject(forwardRef(() => ServicesService))
  private _servicesService: ServicesService;

  @Inject()
  private _permissionsService: PermissionsService;

  public async runNode(
    nodeId: number,
    data: any,
    execution: WorkflowExecution,
    parentTraceUUID: string | null,
  ) {
    const workflow = await this._workflowsService.getWorkflow(
      execution.workflow.id,
    );

    if (!workflow) {
      console.error('No workflow found for node', nodeId);
      return;
    }

    const workflowNode = await this._nodesService.getNode(workflow.id, nodeId);
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

  public async saveExecution(execution: WorkflowExecution) {
    const trace = execution.trace;
    const recursiveSave = async (node: WorkflowExecutionTrace) => {
      const saved = await this._workflowExecutionTraceRepository.insert(node);
      if (saved.identifiers.length !== 1) {
        throw new Error('Could not save trace');
      }
      for (const next of node.next || []) {
        await recursiveSave(next);
      }
      return saved;
    };
    const r = await recursiveSave(trace);
    execution.firstTraceId = r.identifiers[0].id;
    await this._workflowExecutionRepository.insert({
      firstTraceId: execution.firstTraceId,
      status: execution.status,
      workflow: { id: execution.workflow.id },
      statistics: execution.statistics,
    });
  }

  public async getExecutions(performer: User, workflowId: number) {
    const workflow = await this._workflowsService.getWorkflow(workflowId);

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

  public async deleteExecution(
    performer: User,
    executionId: number,
  ): Promise<void | { error: string }> {
    const execution = await this._workflowExecutionRepository.findOne({
      where: { id: executionId },
    });

    if (!execution) {
      return { error: 'Execution not found' };
    }

    if (
      !(await this._permissionsService.can(
        performer,
        'delete',
        execution.workflow.id,
        Workflow,
      ))
    ) {
      return { error: 'Permission denied' };
    }

    await this._workflowExecutionRepository.delete(executionId);
  }

  public async findAndTriggerGlobal(data: any, nodeID: number) {
    for (const workflow of this._workflowsService.getAll()) {
      if (workflow.status !== WorkflowStatus.ENABLED) {
        continue;
      }
      for (const node of workflow.entrypoints) {
        if (node.node.id === nodeID) {
          const triggerNode = this._servicesService.getTrigger(nodeID);
          if (!triggerNode) {
            continue;
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

  crons: { [key: number]: NodeJS.Timeout } = {};

  public startCronForWorkflow(workflowId: number) {
    if (this.crons[workflowId]) {
      return;
    }
    this.crons[workflowId] = setInterval(async () => {
      const workflow = await this._workflowsService.getWorkflow(workflowId);

      if (!workflow.entrypoints || workflow.entrypoints.length === 0) {
        return;
      }
      if (workflow.status !== WorkflowStatus.ENABLED) {
        return;
      }
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
    }, 1000);
  }

  public stopCronForWorkflow(workflow: Workflow) {
    if (this.crons[workflow.id]) {
      clearInterval(this.crons[workflow.id]);
    }
  }
}
