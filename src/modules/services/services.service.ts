import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { DiscordService } from '../../services/discord/discord.service';
import { SpotifyService } from 'src/services/spotify/spotify.service';
import {
  Action,
  ListService,
  Service,
  ServiceMetadata,
  ServiceWithAuth,
  ServiceWithCode,
  ServiceWithOAuth,
  Trigger,
} from '../../types/services';
import { PermissionsService } from '../permissions/permissions.service';
import { User } from '../../types/user';
import { FlowControlService } from '../../services/flow_control/flow-control.service';
import * as process from 'node:process';

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
  ) {
    this.services = [
      this._discordService,
      this._spotifyService,
      this._flowControlService,
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
            (process.env.NODE_ENV === 'development'
              ? 'http://localhost:4040'
              : 'https://wytness.fr') +
            '/api/services/' +
            service.name +
            '/logo',
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
            connection['url'] = (service as ServiceWithOAuth).buildOAuthUrl();
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
}
