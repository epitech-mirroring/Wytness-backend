import { Test, TestingModule } from '@nestjs/testing';
import { NodesService } from './nodes.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Workflow, WorkflowNode, WorkflowNodeNext } from '../../types/workflow';
import { DirectMessageSendAction } from '../../services/discord/nodes/actions/direct-messages/send.action';
import { DirectMessageCreatedTrigger } from '../../services/discord/nodes/triggers/direct-messages/create.trigger';
import { DirectMessageReactAction } from '../../services/discord/nodes/actions/direct-messages/react.action';
import { DiscordService } from '../../services/discord/discord.service';
import { WorkflowsService } from './workflows.service';
import { PermissionsService } from '../permissions/permissions.service';
import { ServicesService } from '../services/services.service';
import { Action, Trigger } from '../../types/services';

describe('NodesService', () => {
  let service: NodesService;
  let nodeRepository: any;
  let nodeNextRepository: any;

  const dmSend = new DirectMessageSendAction();
  const dmReceive = new DirectMessageCreatedTrigger();
  const react = new DirectMessageReactAction();
  const discordService = new DiscordService(dmReceive, dmSend, react);
  dmSend.service = discordService;
  dmReceive.service = discordService;
  react.service = discordService;

  const addableTrigger = new WorkflowNode(1, 'Test Node - Addable');
  const addableAction = new WorkflowNode(2, 'Test Node - Addable');
  const nodeTrigger = new WorkflowNode(3, 'Test Node');
  const nodeAction = new WorkflowNode(4, 'Test Node');

  const oneWorkflow = new Workflow('Test Workflow', 'Test Description');
  const workflowArray: Workflow[] = [oneWorkflow];

  beforeEach(async () => {
    addableAction.previous = null;
    addableAction.node = dmSend;
    addableAction.config = {};
    addableAction.next = [
      { id: 1, parent: addableAction, label: 'output', next: [] },
    ];
    addableAction.workflow = null;

    addableTrigger.previous = null;
    addableTrigger.node = dmReceive;
    addableTrigger.config = {};
    addableTrigger.next = [
      { id: 2, parent: addableTrigger, label: 'output', next: [] },
    ];
    addableTrigger.workflow = null;

    nodeTrigger.previous = null;
    nodeTrigger.node = dmReceive;
    nodeTrigger.config = {};
    nodeTrigger.next = [
      { id: 3, parent: nodeTrigger, label: 'output', next: [] },
    ];

    nodeAction.previous = nodeTrigger.next[0];
    nodeTrigger.next[0].next = [nodeAction];
    nodeAction.node = dmSend;
    nodeAction.config = {};
    nodeAction.next = [
      { id: 4, parent: nodeAction, label: 'output', next: [] },
    ];

    oneWorkflow.id = 1;
    oneWorkflow.entrypoints = [nodeTrigger];
    oneWorkflow.nodes = [nodeTrigger, nodeAction];
    oneWorkflow.owner = undefined;
    nodeAction.workflow = oneWorkflow;
    nodeTrigger.workflow = oneWorkflow;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NodesService,
        {
          provide: getRepositoryToken(WorkflowNode),
          useValue: {
            find: jest.fn().mockResolvedValue([nodeTrigger, nodeAction]),
            // find one that returns the node based on the id passed in { where: { id } }
            findOne: jest.fn().mockImplementation((input) => {
              const id = input.where.id;
              if (id === nodeTrigger.id) {
                return nodeTrigger;
              }
              if (id === nodeAction.id) {
                return nodeAction;
              }
              if (id === addableTrigger.id) {
                return addableTrigger;
              }
              if (id === addableAction.id) {
                return addableAction;
              }
              return null;
            }),
            save: jest.fn(),
            update: jest.fn().mockResolvedValue(true),
            delete: jest.fn().mockResolvedValue(true),
            insert: jest.fn().mockResolvedValue({
              identifiers: [{ id: 1 }],
            }),
          },
        },
        {
          provide: getRepositoryToken(WorkflowNodeNext),
          useValue: {
            find: jest
              .fn()
              .mockResolvedValue([nodeTrigger.next[0], nodeAction.next[0]]),
            findOne: jest.fn().mockImplementation((input) => {
              const parentId = input.where.parent.id;
              if (parentId === nodeTrigger.id) {
                return nodeTrigger.next[0];
              } else if (parentId === nodeAction.id) {
                return nodeAction.next[0];
              } else if (parentId === addableTrigger.id) {
                return addableTrigger.next[0];
              } else if (parentId === addableAction.id) {
                return addableAction.next[0];
              }
              return null;
            }),
            save: jest.fn(),
            update: jest.fn().mockResolvedValue(true),
            delete: jest.fn().mockResolvedValue(true),
            insert: jest.fn().mockResolvedValue(true),
          },
        },
        {
          provide: WorkflowsService,
          useValue: {
            getWorkflow: jest.fn().mockResolvedValue(oneWorkflow),
            getAll: jest.fn().mockReturnValue(workflowArray),
          },
        },
        {
          provide: PermissionsService,
          useValue: {
            can: jest.fn().mockResolvedValue(true),
          },
        },
        {
          provide: ServicesService,
          useValue: {
            getNode: jest
              .fn()
              .mockImplementation((id: number): Trigger | Action => {
                if (id === 1) {
                  return dmReceive;
                }
                if (id === 2) {
                  return dmSend;
                }
                if (id === 3) {
                  return react;
                }
                return null;
              }),
          },
        },
      ],
    }).compile();

    service = module.get<NodesService>(NodesService);
    nodeRepository = module.get(getRepositoryToken(WorkflowNode));
    nodeNextRepository = module.get(getRepositoryToken(WorkflowNodeNext));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should get a node', async () => {
    const node = await service.getNode(1, nodeTrigger.id);
    expect(node).toEqual(nodeTrigger);
  });

  it('should find a node', () => {
    const node = service.findNodeById(nodeTrigger.id);
    expect(node).toEqual(nodeTrigger);
  });

  it('should find a node deep', () => {
    const node = service.findNodeById(nodeAction.id);
    expect(node).toEqual(nodeAction);
  });

  it('should get a node deep', async () => {
    const node = await service.getNode(1, nodeAction.id);
    expect(node).toEqual(nodeAction);
  });

  it('should disconnect a node', async () => {
    const r = await service.disconnectNode(1, nodeAction.id);
    expect(r).not.toBeDefined();
    expect(nodeTrigger.next[0].next).toEqual([]);
    expect(nodeAction.previous).toBeNull();
    expect(nodeRepository.update).toHaveBeenCalledWith(
      { id: nodeAction.id },
      {
        previous: null,
      },
    );
  });

  it('should connect a node', async () => {
    await service.disconnectNode(1, nodeAction.id);
    const r = await service.connectNode(
      1,
      nodeTrigger.id,
      'output',
      nodeAction.id,
    );
    expect(r).not.toBeDefined();
    expect(nodeTrigger.next[0].next).toEqual([nodeAction]);
    expect(nodeAction.previous).toEqual(nodeTrigger.next[0]);
    expect(nodeRepository.update).toHaveBeenCalledWith(
      { id: nodeAction.id },
      {
        previous: {
          parent: {
            id: nodeTrigger.id,
          },
          label: 'output',
        },
      },
    );
    expect(oneWorkflow.nodes.length).toEqual(2);
    expect(oneWorkflow.entrypoints.length).toEqual(1);
    expect(oneWorkflow.strandedNodes.length).toEqual(0);
  });

  it('should add a trigger to a workflow', async () => {
    const r = await service.addNodeToWorkflow(null, 1, 1, null, null, {});
    expect(r).toBeDefined();
    expect('error' in r).toBeFalsy();
    expect(r instanceof WorkflowNode).toBeTruthy();
    const node = r as WorkflowNode;
    expect(node.node).toEqual(dmReceive);
    expect(node.previous).toBeNull();
    expect(node.next.length).toEqual(1);
    expect(node.workflow).toBe(oneWorkflow);
    expect(oneWorkflow.nodes.length).toEqual(3);
    expect(nodeRepository.insert).toHaveBeenCalledTimes(1);
    expect(nodeRepository.insert).toHaveBeenCalledWith({
      config: {},
      node: {
        id: 1,
      },
      previous: null,
      next: [],
      workflow: {
        id: 1,
      },
      position: {
        x: 100,
        y: 100,
      },
    });
    expect(nodeNextRepository.insert).toHaveBeenCalledTimes(1);
    expect(nodeNextRepository.insert).toHaveBeenCalledWith({
      label: 'output',
      parent: {
        id: 1,
      },
      next: [],
    });
    expect(oneWorkflow.entrypoints.length).toEqual(2);
    expect(oneWorkflow.nodes.length).toEqual(3);
    expect(oneWorkflow.strandedNodes.length).toEqual(0);
  });

  it('should add an action to a workflow', async () => {
    const r = await service.addNodeToWorkflow(
      null,
      2,
      1,
      nodeTrigger.id,
      'output',
      {},
    );
    expect(r).toBeDefined();
    expect('error' in r).toBeFalsy();
    expect(r instanceof WorkflowNode).toBeTruthy();
    const node = r as WorkflowNode;

    expect(node.node).toEqual(dmSend);
    expect(node.previous).not.toBeNull();
    expect(node.next.length).toEqual(1);
    expect(node.workflow).toBe(oneWorkflow);
    expect(oneWorkflow.nodes.length).toEqual(3);
    expect(nodeRepository.insert).toHaveBeenCalledTimes(1);
    expect(nodeRepository.insert).toHaveBeenCalledWith({
      config: {},
      node: {
        id: 2,
      },
      previous: null,
      next: [],
      workflow: {
        id: 1,
      },
      position: {
        x: 100,
        y: 100,
      },
    });
    expect(nodeNextRepository.insert).toHaveBeenCalledTimes(1);
    expect(nodeNextRepository.insert).toHaveBeenCalledWith({
      label: 'output',
      parent: {
        id: 1,
      },
      next: [],
    });
    expect(oneWorkflow.entrypoints.length).toEqual(1);
    expect(oneWorkflow.nodes.length).toEqual(3);
  });
});
