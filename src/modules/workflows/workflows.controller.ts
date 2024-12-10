import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  Param,
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
    return this._workflowsService.listWorkflows(this._authContext.user.id);
  }

  @Private()
  @Post('/')
  async createWorkflow(@Body() body: WorkflowCreateDTO) {
    return this._workflowsService.createWorkflow(
      body.name,
      body.description,
      this._authContext.user.id,
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
      return this._workflowsService.addEntrypointToWorkflow(
        body.id,
        workflowIdN,
        body.config,
      );
    } else {
      if (!body.previous) {
        throw new BadRequestException('Missing previous');
      }
      return this._workflowsService.addNodeToWorkflow(
        body.id,
        workflowIdN,
        body.previous,
        body.config,
      );
    }
  }
}
