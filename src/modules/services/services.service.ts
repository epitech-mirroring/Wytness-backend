import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { DiscordService } from '../../services/discord/discord.service';
import { SpotifyService } from '../../services/spotify/spotify.service';
import {
  Action,
  ListService,
  Service,
  ServiceMetadata,
  ServiceWithAuth,
  ServiceWithCode,
  ServiceWithOAuth,
  ServiceWithWebhooks,
  Trigger,
} from '../../types/services';
import { PermissionsService } from '../permissions/permissions.service';
import { User } from '../../types/user';
import { FlowControlService } from '../../services/flow_control/flow-control.service';
import { AirtableService } from '../../services/airtable/airtable.service';
import { isProduction } from '../../types/global';
import { WeatherService } from '../../services/weather/weather.service';
import { OpenAIService } from '../../services/openia/openia.service';
import { TanService } from '../../services/tan/tan.service';
import { GeocodingService } from '../../services/geocoding/geo.service';

@Injectable()
export class ServicesService {
  services: Service[];

  @Inject()
  private readonly _permissionsService: PermissionsService;

  constructor(
    @Inject(forwardRef(() => DiscordService))
    private _discordService: DiscordService,
    @Inject(forwardRef(() => SpotifyService))
    private _spotifyService: SpotifyService,
    @Inject(forwardRef(() => FlowControlService))
    private _flowControlService: FlowControlService,
    @Inject(forwardRef(() => AirtableService))
    private _airtableService: AirtableService,
    @Inject(forwardRef(() => WeatherService))
    private _weatherService: WeatherService,
    @Inject(forwardRef(() => OpenAIService))
    private _openAIService: OpenAIService,
    @Inject(forwardRef(() => TanService))
    private _tanService: TanService,
    @Inject(forwardRef(() => GeocodingService))
    private _geocodingService: GeocodingService,
  ) {
    this.services = [
      this._discordService,
      this._spotifyService,
      this._flowControlService,
      this._airtableService,
      this._weatherService,
      this._openAIService,
      this._tanService,
      this._geocodingService,
    ];
  }

  public addService(service: Service): void {
    this.services.push(service);
  }

  public getServiceByName(name: string): Service | undefined {
    return this.services.find((service) => service.name === name);
  }

  public doesServiceUseAuth(
    serviceName: string,
    type: ServiceMetadata['useAuth'],
  ): boolean {
    const service = this.getServiceByName(serviceName);
    if (!service) {
      return false;
    }
    return service.serviceMetadata.useAuth === type;
  }

  public async listServices(): Promise<ListService[]> {
    return this.services.map(
      (service) =>
        ({
          name: service.name,
          description: service.description,
          logo:
            (!isProduction() ? 'http://localhost:4040' : 'https://wytness.fr') +
            '/api/services/' +
            service.name +
            '/logo.svg',
          color: service.serviceMetadata.color,
        }) as ListService,
    );
  }

  public async getConnections(userId: number, performer: User): Promise<any> {
    const connections = [];

    if (
      !(await this._permissionsService.can(performer, 'read', userId, User))
    ) {
      return connections;
    }

    for (const service of this.services) {
      if (service.serviceMetadata.useAuth) {
        const withAuth = service as ServiceWithAuth;
        const connected = await withAuth.isUserConnected(userId);
        const connection = {
          serviceId: service.name,
          connected,
          type: service.serviceMetadata.useAuth,
        };
        switch (service.serviceMetadata.useAuth) {
          case 'OAuth':
            connection['url'] = await (
              service as ServiceWithOAuth
            ).buildOAuthUrl(userId);
            break;
          case 'code':
            connection['url'] = '/services/' + service.name + '/get-code';
            connection['form'] = (service as ServiceWithCode).getForm();
            connection['alreadyHasCode'] = !!(await (
              service as ServiceWithCode
            ).getCode(userId));
            break;
        }
        connections.push(connection);
      }
    }

    return connections;
  }

  public getTrigger(id: number): Trigger {
    return this.services
      .map((service) => service.nodes)
      .flat()
      .find((node) => node.id === id && node.type == 'trigger') as Trigger;
  }

  public getAction(id: number): Action {
    return this.services
      .map((service) => service.nodes)
      .flat()
      .find((node) => node.id === id && node.type == 'action') as Action;
  }

  public getServiceFromName(name: string): Service {
    return this.services.find((service) => service.name === name);
  }

  public getNode(id: number): Trigger | Action {
    return this.services
      .map((service) => service.nodes)
      .flat()
      .find((node) => node.id === id) as Trigger | Action;
  }

  public getServiceFromNode(nodeId: number): Service {
    return this.services.find((service) =>
      service.nodes.some((node) => node.id === nodeId),
    );
  }

  public async disconnectService(
    userId: number,
    serviceName: string,
  ): Promise<boolean> {
    const service = this.getServiceByName(serviceName);
    if (!service) {
      throw new Error('Service not found');
    }
    if (service.serviceMetadata.useAuth) {
      const withAuth = service as ServiceWithAuth;
      return await withAuth.disconnectUser(userId);
    }
    return false;
  }

  public async manageWebhook(
    service: Service,
    id: string,
    data: any,
    user: User,
  ): Promise<void> {
    const serviceWithWebhooks = this.services.find(
      (s) => s.name === service.name,
    ) as ServiceWithWebhooks;
    if (!serviceWithWebhooks) {
      throw new Error('Service does not support webhooks');
    }
    await serviceWithWebhooks.onWebhookCalled(id, data, user);
  }
}
