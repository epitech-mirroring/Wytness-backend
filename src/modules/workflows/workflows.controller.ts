import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Inject,
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

@Controller('workflows')
export class WorkflowsController {
  @Inject()
  private _workflowsService: WorkflowsService;

  @Inject()
  private _authContext: AuthContext;

  @Private()
  @Get('/')
  async getWorkflows() {
    return this._workflowsService.listWorkflows(1);
  }

  @Private()
  @Get('/:workflowId')
  async getWorkflow(@Param('workflowId') workflowId: string) {
    const workflowIdN = parseInt(workflowId);
    if (isNaN(workflowIdN)) {
      throw new BadRequestException('Invalid workflowId');
    }

    return await this._workflowsService.getWorkflow(workflowIdN);
  }

  @Private()
  @Delete('/:workflowId')
  async deleteWorkflow(@Param('workflowId') workflowId: string) {
    const workflowIdN = parseInt(workflowId);
    if (isNaN(workflowIdN)) {
      throw new BadRequestException('Invalid workflowId');
    }

    return await this._workflowsService.deleteWorkflow(workflowIdN);
  }

  @Private()
  @Patch('/:workflowId')
  async updateWorkflow(
    @Param('workflowId') workflowId: string,
    @Body() body: WorkflowCreateDTO,
  ) {
    const workflowIdN = parseInt(workflowId);
    if (isNaN(workflowIdN)) {
      throw new BadRequestException('Invalid workflowId');
    }

    return await this._workflowsService.updateWorkflow(
      workflowIdN,
      body.name,
      body.description,
    );
  }

  @Private()
  @Post('/')
  async createWorkflow(@Body() body: WorkflowCreateDTO) {
    return await this._workflowsService.createWorkflow(
      body.name,
      body.description,
      1,
    );
  }

  @Private()
  @Get('/:workflowId/nodes')
  async getNodes(@Param('workflowId') workflowId: string) {
    const workflowIdN = parseInt(workflowId);
    if (isNaN(workflowIdN)) {
      throw new BadRequestException('Invalid workflowId');
    }

    return await this._workflowsService.getNodes(workflowIdN);
  }

  @Private()
  @Delete('/:workflowId/nodes/:nodeId')
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
