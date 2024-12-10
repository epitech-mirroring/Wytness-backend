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
    return this._servicesService.getConnections();
  }
}
