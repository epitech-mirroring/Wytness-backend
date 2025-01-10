import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  NotFoundException,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { Private } from '../auth/decorators/private.decorator';
import { WorkflowsService } from './workflows.service';
import {
  WorkflowCreateDTO,
  WorkflowCreateNodeDTO,
} from '../../dtos/workflows/workflows.dto';
import { AuthContext } from '../auth/auth.context';
import { ApiResponse, ApiTags, ApiBody, ApiParam } from '@nestjs/swagger';

@ApiTags('workflows')
@Controller('workflows')
export class WorkflowsController {
  @Inject()
  private _workflowsService: WorkflowsService;

  @Inject()
  private _authContext: AuthContext;

  @Private()
  @Get('/')
  @ApiResponse({
    status: 200,
    description: 'List of workflows',
    schema: {
      properties: {
        workflows: { type: 'array' },
      },
      example: { workflows: [] },
    },
  })
  async getWorkflows() {
    return this._workflowsService.listWorkflows(this._authContext.user);
  }

  @Private()
  @Get('/:workflowId')
  @ApiParam({
    name: 'workflowId',
    description: 'ID of the workflow',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Workflow details',
    schema: {
      properties: {
        id: { type: 'number' },
        name: { type: 'string' },
        description: { type: 'string' },
      },
      example: { id: 1, name: 'string', description: 'string' },
    },
  })
  async getWorkflow(@Param('workflowId') workflowId: string) {
    const workflowIdN = parseInt(workflowId);
    if (isNaN(workflowIdN)) {
      throw new BadRequestException('Invalid workflowId');
    }

    const workflow = await this._workflowsService.getWorkflow(
      this._authContext.user,
      workflowIdN,
    );
    if (workflow) {
      return workflow;
    } else {
      throw new NotFoundException('Workflow not found');
    }
  }

  @Private()
  @Delete('/:workflowId')
  @ApiParam({
    name: 'workflowId',
    description: 'ID of the workflow',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Workflow deleted',
  })
  async deleteWorkflow(@Param('workflowId') workflowId: string) {
    const workflowIdN = parseInt(workflowId);
    if (isNaN(workflowIdN)) {
      throw new BadRequestException('Invalid workflowId');
    }

    if (
      await this._workflowsService.deleteWorkflow(
        this._authContext.user,
        workflowIdN,
      )
    ) {
      return;
    } else {
      throw new NotFoundException('Workflow not found');
    }
  }

  @Private()
  @Patch('/:workflowId')
  @ApiParam({
    name: 'workflowId',
    description: 'ID of the workflow',
    type: 'number',
  })
  @ApiBody({
    description: 'Name and description of the workflow',
    type: WorkflowCreateDTO,
  })
  @ApiResponse({
    status: 200,
    description: 'Workflow updated',
  })
  async updateWorkflow(
    @Param('workflowId') workflowId: string,
    @Body() body: WorkflowCreateDTO,
  ) {
    const workflowIdN = parseInt(workflowId);
    if (isNaN(workflowIdN)) {
      throw new BadRequestException('Invalid workflowId');
    }

    return await this._workflowsService.updateWorkflow(workflowIdN, {
      name: body.name,
      description: body.description,
    });
  }

  @Private()
  @Post('/')
  @ApiBody({
    description: 'Name and description of the workflow',
    type: WorkflowCreateDTO,
  })
  @ApiResponse({
    status: 200,
    description: 'Workflow created',
  })
  async createWorkflow(@Body() body: WorkflowCreateDTO) {
    return await this._workflowsService.createWorkflow(
      body.name,
      body.description,
      this._authContext.user.id,
    );
  }

  @Private()
  @Get('/:workflowId/nodes')
  @ApiParam({
    name: 'workflowId',
    description: 'ID of the workflow',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'List of nodes',
    schema: {
      properties: {
        nodes: { type: 'array' },
      },
      example: { nodes: [] },
    },
  })
  async getNodes(@Param('workflowId') workflowId: string) {
    const workflowIdN = parseInt(workflowId);
    if (isNaN(workflowIdN)) {
      throw new BadRequestException('Invalid workflowId');
    }

    return await this._workflowsService.getNodes(workflowIdN);
  }

  @Private()
  @Delete('/:workflowId/nodes/:nodeId')
  @ApiParam({
    name: 'workflowId',
    description: 'ID of the workflow',
    type: 'number',
  })
  @ApiResponse({
    status: 200,
    description: 'Node deleted',
  })
  async deleteNode(
    @Param('workflowId') workflowId: string,
    @Param('nodeId') nodeId: string,
  ) {
    const workflowIdN = parseInt(workflowId);
    if (isNaN(workflowIdN)) {
      throw new BadRequestException('Invalid workflowId');
    }

    const nodeIdN = parseInt(nodeId);
    if (isNaN(nodeIdN)) {
      throw new BadRequestException('Invalid nodeId');
    }

    return await this._workflowsService.deleteNode(workflowIdN, nodeIdN);
  }

  @Private()
  @Patch('/:workflowId/nodes/:nodeId')
  @ApiParam({
    name: 'workflowId',
    description: 'ID of the workflow',
    type: 'number',
  })
  @ApiParam({
    name: 'nodeId',
    description: 'ID of the node',
    type: 'number',
  })
  @ApiBody({
    description: 'Node configuration',
    type: WorkflowCreateNodeDTO,
  })
  @ApiResponse({
    status: 200,
    description: 'Node updated',
  })
  async updateNode(
    @Param('workflowId') workflowId: string,
    @Param('nodeId') nodeId: string,
    @Body() body: WorkflowCreateNodeDTO,
  ) {
    const workflowIdN = parseInt(workflowId);
    if (isNaN(workflowIdN)) {
      throw new BadRequestException('Invalid workflowId');
    }

    const nodeIdN = parseInt(nodeId);
    if (isNaN(nodeIdN)) {
      throw new BadRequestException('Invalid nodeId');
    }

    return await this._workflowsService.updateNode(
      workflowIdN,
      nodeIdN,
      body.config,
    );
  }

  @Private()
  @Post('/:workflowId/nodes')
  @ApiParam({
    name: 'workflowId',
    description: 'ID of the workflow',
    type: 'number',
  })
  @ApiBody({
    description: 'Node configuration',
    type: WorkflowCreateNodeDTO,
  })
  @ApiResponse({
    status: 200,
    description: 'Node created',
  })
  async createNode(
    @Body() body: WorkflowCreateNodeDTO,
    @Param('workflowId') workflowId: string,
  ) {
    const workflowIdN = parseInt(workflowId);
    if (isNaN(workflowIdN)) {
      throw new BadRequestException('Invalid workflowId');
    }

    if (body.entrypoint) {
      return await this._workflowsService.addEntrypointToWorkflow(
        body.id,
        workflowIdN,
        body.config,
      );
    } else {
      if (!body.previous) {
        throw new BadRequestException('Missing previous');
      }
      return await this._workflowsService.addNodeToWorkflow(
        body.id,
        workflowIdN,
        body.previous,
        body.config,
      );
    }
  }
}
