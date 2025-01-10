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

@Injectable()
export class ServicesService {
  services: Service[];

  constructor(
    @Inject(forwardRef(() => DiscordService))
    private _discordService: DiscordService,
    @Inject(forwardRef(() => SpotifyService))
    private _spotifyService: SpotifyService,
  ) {
    this.services = [this._discordService, this._spotifyService];
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
          ...(service.serviceMetadata || {}),
          id: service.id,
          name: service.name,
          description: service.description,
          nodes: service.nodes.map((node) => {
            return {
              id: node.id,
              name: node.getName(),
              type: node.type,
            };
          }),
        }) as ListService,
    );
  }

  public async getConnections(userId: number): Promise<any> {
    const connections = [];

    for (const service of this.services) {
      if (service.serviceMetadata.useAuth) {
        const oauthService = service as ServiceWithAuth;
        const connected = await oauthService.isUserConnected(userId);
        const connection = {
          serviceId: service.id,
          connected,
          type: service.serviceMetadata.useAuth,
        };
        switch (service.serviceMetadata.useAuth) {
          case 'OAuth':
            connection['url'] = (service as ServiceWithOAuth).buildOAuthUrl();
            break;
          case 'code':
            connection['url'] = '/services/' + service.id + '/get-code';
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

  public getIdFromName(name: string): number {
    return this.services.find((service) => service.name === name)?.id;
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
