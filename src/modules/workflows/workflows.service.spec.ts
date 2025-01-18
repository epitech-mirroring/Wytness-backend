import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowsService } from './workflows.service';
import { Repository } from 'typeorm';
import { Workflow } from '../../types/workflow';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ExecutionsService } from './executions.service';
import { NodesService } from './nodes.service';
import { PermissionsService } from '../permissions/permissions.service';
import { ServicesService } from '../services/services.service';

const oneWorkflow = new Workflow('Test Workflow', 'Test Description');
oneWorkflow.id = 1;
oneWorkflow.nodes = [];
oneWorkflow.owner = undefined;
const workflowArray: Workflow[] = [oneWorkflow];

describe('Workflows Service', () => {
  let service: WorkflowsService;
  let repository: Repository<Workflow>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkflowsService,
        {
          provide: ExecutionsService,
          useValue: {
            runNode: jest.fn(),
          },
        },
        {
          provide: NodesService,
          useValue: {
            getNode: jest.fn(),
          },
        },
        {
          provide: PermissionsService,
          useValue: {
            createPolicy: jest.fn().mockResolvedValue('User'),
            addRuleToPolicy: jest.fn().mockResolvedValue(1),
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
            save: jest.fn(),
            update: jest.fn().mockResolvedValue(true),
            delete: jest.fn().mockResolvedValue(true),
          },
        },
      ],
    }).compile();

    service = module.get<WorkflowsService>(WorkflowsService);
    repository = module.get<Repository<Workflow>>(getRepositoryToken(Workflow));

    await service.onModuleInit();
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
});
