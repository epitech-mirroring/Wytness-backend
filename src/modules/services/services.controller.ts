import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { ServicesService } from './services.service';
import { Private } from '../auth/decorators/private.decorator';
import { ServiceConnectDTO } from '../../dtos/services/services.dto';
import { AuthContext } from '../auth/auth.context';
import { ServiceWithCode, ServiceWithOAuth } from '../../types/services';
import { NodeDTO } from '../../dtos/node/node.dto';
import { ApiResponse, ApiTags, ApiBody, ApiParam } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';

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

    let success = false;
    let message = '';
    switch (service.serviceMetadata.useAuth) {
      case 'OAuth':
        try {
          await (service as ServiceWithOAuth).onOAuthCallback(
            body,
            this._authContext.user,
          );
          success = true;
        } catch (error) {
          success = false;
          message = error.message;
        }
        break;
      case 'code':
        success = await (service as ServiceWithCode).verifyCode(
          this._authContext.user.id,
          parseInt(body.code),
        );
        break;
      default:
        throw new BadRequestException(
          'Service does not use OAuth or code auth',
        );
    }
    if (!success) {
      throw new InternalServerErrorException(message);
    }
    return;
  }

  @Private()
  @Post('/:serviceName/connect/form')
  @ApiParam({
    name: 'serviceName',
    description: 'Name of the service',
    type: 'string',
  })
  @ApiBody({
    description: 'Service connection form data',
    type: Object,
  })
  @ApiResponse({
    status: 200,
    description: 'Service connection form submitted',
  })
  @ApiResponse({
    status: 400,
    description: 'Service does not use code auth',
  })
  async postAuthForm(
    @Param('serviceName') serviceName: string,
    @Body() body: any,
  ) {
    const service = this._servicesService.getServiceByName(serviceName);
    if (!service) {
      throw new NotFoundException('Service not found');
    }

    if (service.serviceMetadata.useAuth !== 'code') {
      throw new BadRequestException('Service does not use code auth');
    }
    try {
      await (service as ServiceWithCode).generateCode(
        this._authContext.user.id,
        body,
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Public()
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
      fields: this._authContext.authenticated ? node.getFields() : undefined,
    }));
    return nodeDTO;
  }

  @Public()
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
    return this._servicesService.getConnections(
      this._authContext.user.id,
      this._authContext.user,
    );
  }
}
