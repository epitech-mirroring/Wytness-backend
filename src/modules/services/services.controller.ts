import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { ServicesService } from './services.service';
import { Private } from '../auth/decorators/private.decorator';
import { ServiceConnectDTO } from '../../dtos/services/services.dto';
import { AuthContext } from '../auth/auth.context';
import { ServiceWithOAuth } from '../../types/services';
import { NodeDTO } from '../../dtos/node/node.dto';
import { ApiResponse, ApiTags, ApiBody, ApiParam } from '@nestjs/swagger';

@ApiTags('services')
@Controller('services')
export class ServicesController {
  @Inject()
  private _servicesService: ServicesService;

  @Inject()
  private _authContext: AuthContext;

  @Private()
  @Post('/:serviceName/connect')
  @ApiParam({
    name: 'serviceName',
    description: 'Name of the service',
    type: 'string',
  })
  @ApiBody({
    description: 'Service connection data',
    type: ServiceConnectDTO,
  })
  @ApiResponse({
    status: 200,
    description: 'Service connected',
  })
  async authCallBack(
    @Param('serviceName') serviceName: string,
    @Body() body: ServiceConnectDTO,
  ) {
    const service = this._servicesService.getServiceByName(serviceName);
    if (!service) {
      throw new NotFoundException('Service not found');
    }

    if (!service.serviceMetadata.useOAuth) {
      throw new BadRequestException('Service does not use OAuth');
    }

    await (service as ServiceWithOAuth).onOAuthCallback(
      body,
      this._authContext.user,
    );
  }

  @Private()
  @Get('/:serviceName/nodes')
  @ApiParam({
    name: 'serviceName',
    description: 'Name of the service',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'List of service nodes',
    schema: {
      properties: {
        nodes: { type: 'array' },
      },
      example: { nodes: [] },
    },
  })
  async getServiceNodes(@Param('serviceName') serviceName: string) {
    const service = this._servicesService.getServiceByName(serviceName);
    if (!service) {
      throw new NotFoundException('Service not found');
    }
    const nodeDTO: NodeDTO[] = service.nodes.map((node) => ({
      id: node.id,
      name: node.getName(),
      description: node.getDescription(),
      type: node.type,
      fields: node.getFields()
    }));
    return nodeDTO;
  }

  @Private()
  @Get('/')
  @ApiResponse({
    status: 200,
    description: 'List of services',
    schema: {
      properties: {
        services: { type: 'array' },
      },
      example: { services: [] },
    },
  })
  async getServices() {
    return this._servicesService.listServices();
  }

  @Private()
  @Get('/connected')
  @ApiResponse({
    status: 200,
    description: 'List of services with information about the connection',
    schema: {
      properties: {
        services: { type: 'array' },
      },
      example: { services: [] },
    },
  })
  async getConnectedServices() {
    return this._servicesService.getConnections(this._authContext.user.id);
  }
}
