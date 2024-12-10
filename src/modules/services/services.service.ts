import {
  forwardRef,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { DiscordService } from '../../services/discord/discord.service';
import { AuthContext } from '../auth/auth.context';
import {
  Action,
  ListService,
  Service,
  ServiceWithOAuth,
  Trigger,
} from '../../types/services';

@Injectable()
export class ServicesService {
  services: Service[];

  @Inject(AuthContext)
  private _authContext: AuthContext;

  constructor(
    @Inject(forwardRef(() => DiscordService))
    private _discordService: DiscordService,
  ) {
    this.services = [this._discordService];
  }

  public addService(service: Service): void {
    this.services.push(service);
  }

  public getServiceByName(name: string): Service | undefined {
    return this.services.find((service) => service.name === name);
  }

  public doesServiceUseOAuth(serviceName: string): boolean {
    const service = this.getServiceByName(serviceName);
    if (!service) {
      return false;
    }
    return service.serviceMetadata.useOAuth;
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

  public async getConnections(): Promise<any> {
    if (!this._authContext.authenticated) {
      throw new UnauthorizedException('User is not authenticated');
    }

    const connections = [];

    for (const service of this.services) {
      if (service.serviceMetadata.useOAuth) {
        const oauthService = service as ServiceWithOAuth;
        const connected = await oauthService.isUserConnected(
          this._authContext.user.id,
        );
        connections.push({
          serviceId: service.id,
          connected,
          url: oauthService.buildOAuthUrl(),
        });
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
}
