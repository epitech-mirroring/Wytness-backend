import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Workflow, WorkflowNode, WorkflowNodeNext } from '../../types/workflow';
import { Repository } from 'typeorm';
import { WorkflowsService } from './workflows.service';
import { User } from '../../types/user';
import { PermissionsService } from '../permissions/permissions.service';
import { ServicesService } from '../services/services.service';
import { NodeType } from '../../types/services';
import { ExecutionsService } from './executions.service';

@Injectable()
export class NodesService {
  @InjectRepository(WorkflowNode)
  private _workflowNodeRepository: Repository<WorkflowNode>;

  @InjectRepository(WorkflowNodeNext)
  private _workflowNodeNextRepository: Repository<WorkflowNodeNext>;

  @Inject(forwardRef(() => WorkflowsService))
  private _workflowsService: WorkflowsService;

  @Inject(forwardRef(() => ExecutionsService))
  private _executionsService: ExecutionsService;

  @Inject()
  private _permissionsService: PermissionsService;

  @Inject(forwardRef(() => ServicesService))
  private _servicesService: ServicesService;

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

  public async getNode(
    workflowId: number,
    nodeId: number,
  ): Promise<WorkflowNode | undefined> {
    const workflow = await this._workflowsService.getWorkflow(workflowId);
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
    return undefined;
  }

  public findNodeById(nodeId: number): WorkflowNode | undefined {
    for (const workflow of this._workflowsService.getAll()) {
      for (const node of workflow.entrypoints) {
        const found = this.recursiveFindNode(node, nodeId);
        if (found) {
          return found;
        }
      }
    }
    return undefined;
  }

  /**
   * Disconnects a node from its previous node
   * @param workflowId The workflow id
   * @param nodeId The node id
   */
  public async disconnectNode(
    workflowId: number,
    nodeId: number,
  ): Promise<void | { error: string }> {
    const dbNode = await this._workflowNodeRepository.findOne({
      where: { id: nodeId },
      relations: ['previous', 'previous.parent'],
    });

    const ramNode = await this.getNode(workflowId, nodeId);
    const workflow = await this._workflowsService.getWorkflow(workflowId);

    if (!workflow) {
      return { error: 'Workflow not found' };
    }

    if (!dbNode || !ramNode) {
      return { error: 'Node not found' };
    }

    if (!dbNode.previous || !ramNode.previous) {
      return { error: 'Node has no previous node' };
    }
    const previous = await this.getNode(workflowId, dbNode.previous.parent.id);

    if (!previous) {
      return { error: 'Previous node not found' };
    }

    // Disconnect node from previous in RAM
    previous.next = previous.next.map((next) => {
      return {
        id: next.id,
        parent: next.parent,
        label: next.label,
        next: next.next.filter((n) => n.id !== nodeId),
      };
    });
    ramNode.previous = null;

    // Disconnect node from previous in DB
    await this._workflowNodeRepository.update(
      {
        id: nodeId,
      },
      {
        previous: null,
      },
    );
    workflow.strandedNodes.push(ramNode);
  }

  /**
   * Connects a node to another node
   * @param workflowId The workflow id
   * @param fromNodeId The node to connect from
   * @param label The output label of the node it connects from
   * @param toNodeId The node to connect to
   */
  public async connectNode(
    workflowId: number,
    fromNodeId: number,
    label: string,
    toNodeId: number,
  ): Promise<void | { error: string }> {
    const workflow = await this._workflowsService.getWorkflow(workflowId);

    const dbNodeA = await this._workflowNodeRepository.findOne({
      where: { id: fromNodeId },
      relations: ['next', 'node'],
    });
    const ramNodeA = await this.getNode(workflowId, fromNodeId);

    const dbNodeB = await this._workflowNodeRepository.findOne({
      where: { id: toNodeId },
    });
    const ramNodeB = await this.getNode(workflowId, toNodeId);

    if (!workflow) {
      return { error: 'Workflow not found' };
    }

    if (!dbNodeA || !ramNodeA) {
      return { error: 'Node A not found' };
    }
    if (!dbNodeB || !ramNodeB) {
      return { error: 'Node B not found' };
    }

    if (!ramNodeA.node.labels.includes(label)) {
      return { error: 'Invalid label' };
    }

    // Connect node in RAM
    ramNodeA.addNext(ramNodeB, label);
    ramNodeB.previous = ramNodeA.next.find((n) => n.label === label);

    // Connect node in DB
    const previousOutput = await this._workflowNodeNextRepository.findOne({
      where: { parent: { id: fromNodeId }, label },
    });

    if (!previousOutput) {
      return { error: 'Output not found' };
    }

    await this._workflowNodeRepository.update(
      {
        id: toNodeId,
      },
      {
        previous: {
          id: previousOutput.id,
        },
      },
    );

    // Remove the newly connected node from the stranded nodes
    workflow.strandedNodes = workflow.strandedNodes.filter(
      (node) => node.id !== toNodeId,
    );
  }

  public async deleteNode(
    performer: User,
    workflowId: number,
    nodeId: number,
  ): Promise<void | { error: string }> {
    const workflow = await this._workflowsService.getWorkflow(
      workflowId,
      performer,
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

    // Get the current node, in the DB and in the RAM
    const nodeRam = this.getNode(workflowId, nodeId);
    const nodeDb = await this._workflowNodeRepository.findOne({
      where: { id: nodeId },
      relations: ['next', 'next.next'],
    });

    if (!nodeRam || !nodeDb) {
      return { error: 'Node not found' };
    }

    await this.disconnectNode(workflowId, nodeId);

    for (const next of nodeDb.next) {
      for (const n of next.next) {
        await this.disconnectNode(workflowId, n.id);
      }
    }
    return await this.removeNodeFromWorkflow(workflowId, nodeId);
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
    const workflow = await this._workflowsService.getWorkflow(
      workflowId,
      performer,
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

    const node = await this.getNode(workflowId, nodeId);

    if (!node) {
      return { error: 'Node not found' };
    }

    const oldLabel = node.previous ? node.previous.label : undefined;

    if (previousNodeId !== undefined || label) {
      await this.disconnectNode(workflowId, nodeId);
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
      await this.connectNode(
        workflowId,
        previousNodeId,
        label || oldLabel,
        nodeId,
      );
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
    previousNodeId: number | null,
    previousNodeLabel: string | null,
    config: any,
    position?: { x: number; y: number },
  ): Promise<WorkflowNode | { error: string }> {
    const workflow = await this._workflowsService.getWorkflow(
      workflowId,
      performer,
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

    if (
      (!previousNodeId && previousNodeLabel) ||
      (previousNodeId && !previousNodeLabel)
    ) {
      return { error: 'Invalid previous node configuration' };
    }

    let previousNode: WorkflowNode | null = null;
    if (previousNodeId) {
      previousNode = await this.getNode(workflowId, previousNodeId);
      if (!previousNode) {
        return { error: 'Previous node not found' };
      }
      if (!previousNode.node.labels.includes(previousNodeLabel)) {
        return { error: 'Invalid label' };
      }
    }

    const serviceNode = this._servicesService.getNode(nodeId);
    if (!serviceNode) {
      return { error: 'Node not found' };
    }
    if (serviceNode.type === NodeType.TRIGGER && previousNodeId) {
      return { error: 'Trigger nodes cannot have a previous node' };
    }

    // Create the node in the DB
    const id = (
      await this._workflowNodeRepository.insert({
        config,
        previous: null,
        position: position || { x: 100, y: 100 },
        node: {
          id: nodeId,
        },
        next: [],
        // @ts-expect-error Type 'Workflow' is not assignable to type 'any'
        workflow: {
          id: workflowId,
        },
      })
    ).identifiers[0].id;

    for (const label of serviceNode.labels) {
      await this._workflowNodeNextRepository.insert({
        label,
        parent: {
          id,
        },
        next: [],
      });
    }

    const dbNode = await this._workflowNodeRepository.findOne({
      where: { id },
      relations: ['next'],
    });

    // Create the node in RAM

    const node = new WorkflowNode(id, config);
    node.workflow = workflow;
    node.previous = null;
    node.node = this._servicesService.getNode(nodeId);
    node.position = position || { x: 100, y: 100 };
    node.next = dbNode.next.map((next) => {
      return {
        id: next.id,
        parent: node,
        label: next.label,
        next: [],
      };
    });

    if (serviceNode.type !== NodeType.TRIGGER) {
      workflow.strandedNodes.push(node);
    } else if (serviceNode.type === NodeType.TRIGGER) {
      workflow.entrypoints.push(node);
    }
    workflow.nodes.push(node);
    // Connect the node to the previous node

    if (previousNode) {
      const r = await this.connectNode(
        workflowId,
        previousNodeId,
        previousNodeLabel,
        id,
      );
      if (r) {
        return r;
      }
    }

    const needCron = workflow.entrypoints.some((node) => {
      return node.node.service.serviceMetadata.useCron;
    });
    if (!needCron) {
      this._executionsService.stopCronForWorkflow(workflow);
    }

    return node;
  }

  private async removeNodeFromWorkflow(
    workflowId: number,
    nodeId: number,
  ): Promise<void | { error: string }> {
    const nodeRam = this.getNode(workflowId, nodeId);
    const nodeDb = await this._workflowNodeRepository.findOne({
      where: { id: nodeId },
    });

    if (!nodeRam || !nodeDb) {
      return { error: 'Node not found' };
    }

    await this._workflowNodeRepository.delete({
      id: nodeId,
    });

    const workflow = await this._workflowsService.getWorkflow(workflowId);
    workflow.nodes = workflow.nodes.filter((node) => node.id !== nodeId);
    workflow.strandedNodes = workflow.strandedNodes.filter(
      (node) => node.id !== nodeId,
    );
    workflow.entrypoints = workflow.entrypoints.filter(
      (node) => node.id !== nodeId,
    );

    if (await this.getNode(workflowId, nodeId)) {
      return { error: 'Could not delete node' };
    }

    const needCron = workflow.entrypoints.some((node) => {
      return node.node.service.serviceMetadata.useCron;
    });
    if (!needCron) {
      this._executionsService.stopCronForWorkflow(workflow);
    }
  }

  async loadNodeTree(nodeId: number): Promise<WorkflowNode | undefined> {
    const dbNode = await this._workflowNodeRepository.findOne({
      where: { id: nodeId },
      relations: ['next', 'next.next', 'node', 'node.service'],
    });

    if (!dbNode) {
      return undefined;
    }

    const node = new WorkflowNode(dbNode.id, dbNode.config);
    node.node = this._servicesService.getNode(dbNode.node.id);
    node.position = dbNode.position;
    node.previous = null;
    node.next = await Promise.all(
      dbNode.next.map(async (next) => {
        return {
          id: next.id,
          label: next.label,
          parent: node,
          next: await Promise.all(
            next.next.map(async (n) => {
              const node = await this.loadNodeTree(n.id);
              if (!node) {
                throw new Error('Node not found');
              }
              node.previous = next;
              return node;
            }),
          ),
        };
      }),
    );
    node.workflow = null;
    return node;
  }
}
