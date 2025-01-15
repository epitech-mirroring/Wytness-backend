import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Inject,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
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
  async getWorkflows(
    @Query('limit') limit?: string,
    @Query('sort') sort?: string,
    @Query('order') order?: 'ASC' | 'DESC',
  ) {
    const options = {};
    if (sort) {
      options['sort'] = sort;
    }
    if (order) {
      options['order'] = order;
    }
    if (limit) {
      options['limit'] = parseInt(limit);
    }
    return this._workflowsService.listWorkflows(
      this._authContext.user,
      options,
    );
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

    const workflow = await this._workflowsService.updateWorkflow(
      this._authContext.user,
      workflowIdN,
      body.status,
      body.name,
      body.description,
    );
    if (workflow) {
      return;
    } else {
      throw new NotFoundException('Workflow not found');
    }
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
    const created = await this._workflowsService.createWorkflow(
      this._authContext.user,
      body.name,
      body.description,
    );
    if (created) {
      return;
    } else {
      throw new ForbiddenException('Not authorized');
    }
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
    const response = await this._workflowsService.getNodes(
      this._authContext.user,
      workflowIdN,
    );
    if (response) {
      return response;
    } else {
      throw new NotFoundException('Workflow not found');
    }
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

    return await this._workflowsService.deleteNode(
      this._authContext.user,
      workflowIdN,
      nodeIdN,
    );
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
      this._authContext.user,
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

    const response = await this._workflowsService.addNodeToWorkflow(
      this._authContext.user,
      body.id,
      workflowIdN,
      body.previous,
      body.label,
      body.config,
    );
    if (response) {
      return;
    } else {
      throw new NotFoundException('Node not found');
    }
  }
}
