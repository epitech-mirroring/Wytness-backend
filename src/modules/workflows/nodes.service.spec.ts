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

const dmSend = new DirectMessageSendAction();
const dmReceive = new DirectMessageCreatedTrigger();
const react = new DirectMessageReactAction();
const discordService = new DiscordService(dmReceive, dmSend, react);
dmSend.service = discordService;
dmReceive.service = discordService;
react.service = discordService;

const nodeTrigger = new WorkflowNode(9768, 'Test Node');
nodeTrigger.previous = null;
nodeTrigger.node = dmReceive;
nodeTrigger.config = {};
const oneNodeNext = new WorkflowNodeNext();
oneNodeNext.parent = nodeTrigger;
oneNodeNext.label = 'output';
oneNodeNext.id = 76678;
oneNodeNext.next = [];

const nodeAction = new WorkflowNode(5467, 'Test Node');
nodeAction.previous = oneNodeNext;
nodeAction.node = dmSend;
nodeAction.config = {};
nodeAction.next = [];
oneNodeNext.next = [nodeAction];
const nodeActionNext = new WorkflowNodeNext();
nodeActionNext.parent = nodeAction;
nodeActionNext.label = 'output';
nodeActionNext.id = 6567;
nodeActionNext.next = [];
nodeAction.previous = oneNodeNext;
nodeAction.next = [nodeActionNext];
nodeTrigger.next = [oneNodeNext];

const oneWorkflow = new Workflow('Test Workflow', 'Test Description');
oneWorkflow.id = 1;
oneWorkflow.nodes = [];
oneWorkflow.entrypoints = [nodeTrigger];
oneWorkflow.nodes = [nodeTrigger, nodeAction];
oneWorkflow.owner = undefined;
const workflowArray: Workflow[] = [oneWorkflow];

describe('NodesService', () => {
  let service: NodesService;
  let nodeRepository: any;
  let nodeNextRepository: any;

  beforeEach(async () => {
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
              if (id === 9768) {
                return nodeTrigger;
              } else if (id === 5467) {
                return nodeAction;
              }
              return null;
            }),
            save: jest.fn(),
            update: jest.fn().mockResolvedValue(true),
            delete: jest.fn().mockResolvedValue(true),
          },
        },
        {
          provide: getRepositoryToken(WorkflowNodeNext),
          useValue: {
            find: jest.fn().mockResolvedValue([oneNodeNext, nodeActionNext]),
            findOne: jest.fn().mockImplementation((input) => {
              const parentId = input.where.parent.id;
              if (parentId === 9768) {
                return oneNodeNext;
              } else if (parentId === 5467) {
                return nodeActionNext;
              }
              return null;
            }),
            save: jest.fn(),
            update: jest.fn().mockResolvedValue(true),
            delete: jest.fn().mockResolvedValue(true),
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
          useValue: {},
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
    const node = await service.getNode(1, 9768);
    expect(node).toEqual(nodeTrigger);
  });

  it('should find a node', () => {
    const node = service.findNodeById(9768);
    expect(node).toEqual(nodeTrigger);
  });

  it('should find a node deep', () => {
    const node = service.findNodeById(5467);
    expect(node).toEqual(nodeAction);
  });

  it('should get a node deep', async () => {
    const node = await service.getNode(1, 5467);
    expect(node).toEqual(nodeAction);
  });

  it('should disconnect a node', async () => {
    const r = await service.disconnectNode(1, 5467);
    expect(r).not.toBeDefined();
    expect(nodeTrigger.next[0].next).toEqual([]);
    expect(nodeAction.previous).toBeNull();
    expect(nodeRepository.update).toHaveBeenCalledWith(
      { id: 5467 },
      {
        previous: null,
      },
    );
  });

  it('should connect a node', async () => {
    await service.disconnectNode(1, 5467);
    const r = await service.connectNode(1, 9768, 'output', 5467);
    expect(r).not.toBeDefined();
    expect(nodeTrigger.next[0].next).toEqual([nodeAction]);
    expect(nodeAction.previous).toEqual(nodeTrigger.next[0]);
    expect(nodeNextRepository.save).toHaveBeenCalledTimes(1);
  });
});
