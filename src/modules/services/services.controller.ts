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
import { ServiceWithCode, ServiceWithOAuth } from '../../types/services';

@Controller('services')
export class ServicesController {
  @Inject()
  private _servicesService: ServicesService;

  @Inject()
  private _authContext: AuthContext;

  @Private()
  @Post('/:serviceName/connect')
  async authCallBack(
    @Param('serviceName') serviceName: string,
    @Body() body: ServiceConnectDTO,
  ) {
    const service = this._servicesService.getServiceByName(serviceName);
    if (!service) {
      throw new NotFoundException('Service not found');
    }

    switch (service.serviceMetadata.useAuth) {
      case 'OAuth':
        await (service as ServiceWithOAuth).onOAuthCallback(
          body,
          this._authContext.user,
        );
        break;
      case 'code':
        await (service as ServiceWithCode).verifyCode(
          this._authContext.user.id,
          parseInt(body.code),
        );
        break;
      default:
        throw new BadRequestException(
          'Service does not use OAuth or code auth',
        );
    }
  }

  @Private()
  @Post('/:serviceName/connect/form')
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

  @Private()
  @Get('/:serviceName/nodes')
  async getServiceNodes(@Param('serviceName') serviceName: string) {
    const service = this._servicesService.getServiceByName(serviceName);
    if (!service) {
      throw new NotFoundException('Service not found');
    }

    return service.nodes;
  }

  @Private()
  @Get('/')
  async getServices() {
    return this._servicesService.listServices();
  }

  @Private()
  @Get('/connected')
  async getConnectedServices() {
    return this._servicesService.getConnections(this._authContext.user.id);
  }
}
