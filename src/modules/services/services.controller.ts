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
  Query,
  Res,
} from '@nestjs/common';
import { ServicesService } from './services.service';
import { Private } from '../auth/decorators/private.decorator';
import { ServiceConnectDTO } from '../../dtos/services/services.dto';
import { AuthContext } from '../auth/auth.context';
import {
  ListService,
  NodeType,
  ServiceWithCode,
  ServiceWithOAuth,
} from '../../types/services';
import { NodeDTO } from '../../dtos/node/node.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiInternalServerErrorResponse,
  ApiParam,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import * as fs from 'fs';
import { Response } from 'express';
import { isProduction } from '../../types/global';

@ApiTags('Services')
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
  @ApiResponse({
    status: 404,
    description: 'Service not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Service does not use OAuth or code auth',
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
  })
  @ApiBearerAuth('token')
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
        if (!body.state) {
          throw new BadRequestException('State is required for OAuth');
        }
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
  @Post('/:serviceName/disconnect')
  @ApiParam({
    name: 'serviceName',
    description: 'Name of the service',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Service disconnected',
  })
  @ApiResponse({
    status: 404,
    description: 'Service not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Service does not use OAuth or code auth',
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
  })
  @ApiBearerAuth('token')
  async disconnect(@Param('serviceName') serviceName: string) {
    const service = this._servicesService.getServiceByName(serviceName);
    if (!service) {
      throw new NotFoundException('Service not found');
    }
    if (service.serviceMetadata.useAuth === undefined) {
      throw new BadRequestException('Service does not use OAuth or code auth');
    }

    const success = await this._servicesService.disconnectService(
      this._authContext.user.id,
      serviceName,
    );
    if (!success) {
      throw new InternalServerErrorException('Failed to disconnect service');
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
  @ApiResponse({
    status: 404,
    description: 'Service not found',
  })
  @ApiBearerAuth('token')
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
      items: {
        $ref: getSchemaPath(NodeDTO),
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Service not found',
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
      fields: node.getFields(),
      labels: node.labels,
    }));
    return nodeDTO;
  }

  @Public()
  @Get('/')
  @ApiResponse({
    status: 200,
    description: 'List of services',
    schema: {
      items: {
        $ref: getSchemaPath(ListService),
      },
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

  @Public()
  @Get('/:serviceName/logo.svg')
  @ApiParam({
    name: 'serviceName',
    description: 'Name of the service',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Service logo',
    schema: {
      type: 'string',
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Service not found',
  })
  async getServiceLogo(
    @Res() response: Response,
    @Param('serviceName') serviceName: string,
    @Query('color') color?: string,
    @Query('width') width?: string,
    @Query('height') height?: string,
  ) {
    const service = this._servicesService.getServiceByName(serviceName);
    if (!service) {
      throw new NotFoundException('Service not found');
    }
    const file = `assets/services/${serviceName}.svg`;
    let content = fs.readFileSync(file, 'utf8');
    if (color) {
      content = content.replace(/fill="#[0-9A-F]{6}"/gm, `fill="${color}"`);
    }
    if (width) {
      content = content.replace(/width="(\d+)"/, `width="${width}"`);
      if (!content.includes('width')) {
        content = content.replace('<svg', `<svg width="${width}"`);
      }
    }
    if (height) {
      content = content.replace(/height="(\d+)"/, `height="${height}"`);
      if (!content.includes('height')) {
        content = content.replace('<svg', `<svg height="${height}"`);
      }
    }
    response.appendHeader('Content-Type', 'image/svg+xml');
    response.send(content);
  }

  @Public()
  @Get('/about.json')
  public async getAbout() {
    return {
      client: {
        host: isProduction() ? 'https://wytness.fr' : 'http://localhost:3000',
      },
      server: {
        current_time: Date.now(),
        services: this._servicesService.services.map((service) => {
          return {
            name: service.name,
            actions: service.nodes
              .filter((node) => node.type === NodeType.TRIGGER)
              .map((node) => {
                return {
                  name: node.getName(),
                  description: node.getDescription(),
                };
              }),
            reactions: service.nodes
              .filter((node) => node.type === NodeType.ACTION)
              .map((node) => {
                return {
                  name: node.getName(),
                  description: node.getDescription(),
                };
              }),
          };
        }),
      },
    };
  }
}
