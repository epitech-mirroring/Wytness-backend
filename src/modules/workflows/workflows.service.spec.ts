import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowsService } from './workflows.service';
import { Repository } from 'typeorm';
import { Workflow, WorkflowNode, WorkflowStatus } from '../../types/workflow';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ExecutionsService } from './executions.service';
import { NodesService } from './nodes.service';
import { PermissionsService } from '../permissions/permissions.service';
import { ServicesService } from '../services/services.service';
import { User } from '../../types/user';
import { DiscordService } from '../../services/discord/discord.service';
import { DirectMessageSendAction } from '../../services/discord/nodes/actions/direct-messages/send.action';
import { DirectMessageCreatedTrigger } from '../../services/discord/nodes/triggers/direct-messages/create.trigger';
import { DirectMessageReactAction } from '../../services/discord/nodes/actions/direct-messages/react.action';

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
nodeTrigger.next = [{ id: 1, parent: nodeTrigger, label: 'Next', next: [] }];

const oneWorkflow = new Workflow('Test Workflow', 'Test Description');
oneWorkflow.id = 1;
oneWorkflow.nodes = [];
oneWorkflow.entrypoints = [nodeTrigger];
oneWorkflow.nodes = [nodeTrigger];
oneWorkflow.owner = undefined;
const workflowArray: Workflow[] = [oneWorkflow];

describe('Workflows Service', () => {
  let service: WorkflowsService;
  let repository: Repository<Workflow>;
  let executionsService: ExecutionsService;
  let nodesService: NodesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkflowsService,
        {
          provide: ExecutionsService,
          useValue: {
            runNode: jest.fn(),
            getExecutions: jest.fn().mockResolvedValue([{ id: 10 }]),
            deleteExecution: jest.fn().mockResolvedValue(true),
          },
        },
        {
          provide: NodesService,
          useValue: {
            getNode: jest.fn(),
            loadNodeTree: jest.fn().mockResolvedValue(nodeTrigger),
            deleteNode: jest.fn(),
          },
        },
        {
          provide: PermissionsService,
          useValue: {
            createPolicy: jest.fn().mockResolvedValue('User'),
            addRuleToPolicy: jest.fn().mockResolvedValue(1),
            can: jest.fn().mockResolvedValue(true),
          },
        },
        {
          provide: ServicesService,
          useValue: {
            getNode: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Workflow),
          useValue: {
            find: jest.fn().mockResolvedValue(workflowArray),
            save: jest.fn().mockResolvedValue(oneWorkflow),
            findOne: jest.fn().mockResolvedValue(oneWorkflow),
            update: jest.fn().mockResolvedValue(true),
            delete: jest.fn().mockResolvedValue(true),
          },
        },
        {
          provide: ExecutionsService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<WorkflowsService>(WorkflowsService);
    repository = module.get<Repository<Workflow>>(getRepositoryToken(Workflow));
    executionsService = module.get<ExecutionsService>(ExecutionsService);
    nodesService = module.get<NodesService>(NodesService);

    await service.onModuleInit();

    await new Promise((resolve) => setTimeout(resolve, 1000));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return an array of workflows', async () => {
    expect(service.getAll()).toEqual(workflowArray);
  });

  it('should return a workflow', async () => {
    await expect(service.getWorkflow(1)).resolves.toEqual(oneWorkflow);
  });

  it("shouldn't return a workflow", async () => {
    await expect(service.getWorkflow(2)).resolves.toEqual(undefined);
  });

  it('should list all workflows', async () => {
    await expect(service.listWorkflows(null)).resolves.toEqual(workflowArray);
  });

  it('should create a workflow', async () => {
    const newWorkflow = new Workflow('New Workflow', 'New Description');
    newWorkflow.id = 1;
    newWorkflow.owner = undefined;
    newWorkflow.nodes = [];
    newWorkflow.entrypoints = [];
    newWorkflow.status = WorkflowStatus.DISABLED;
    newWorkflow.strandedNodes = [];
    await expect(
      service.createWorkflow(
        { id: 1 } as unknown as User,
        'New Workflow',
        'New Description',
      ),
    ).resolves.toEqual(newWorkflow);

    expect(service.getAll()).toEqual([oneWorkflow, newWorkflow]);
  });

  it('should update a workflow', async () => {
    oneWorkflow.status = WorkflowStatus.ENABLED;
    oneWorkflow.description = 'Updated Description';
    oneWorkflow.name = 'Updated Workflow';
    await expect(
      service.updateWorkflow(
        null,
        1,
        WorkflowStatus.ENABLED,
        'Updated Workflow',
        'Updated Description',
      ),
    ).resolves.toStrictEqual(oneWorkflow);

    expect(service.getAll()).toEqual([oneWorkflow]);
  });

  it('should delete a workflow', async () => {
    await expect(service.deleteWorkflow(null, 1)).resolves.toEqual(true);
    expect(executionsService.deleteExecution).toHaveBeenCalledWith(null, 10);
    expect(repository.delete).toHaveBeenCalledWith({ id: 1 });
    expect(nodesService.deleteNode).toHaveBeenCalledWith(null, 1, 9768);
    expect(service.getAll()).toEqual([]);
  });
});
