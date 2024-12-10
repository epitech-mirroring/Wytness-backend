import {
  forwardRef,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import {
  Action,
  IdOf,
  ListService,
  Service,
  ServiceWithOAuth,
  Trigger,
} from '../../types';
import { DiscordService } from '../../services/discord/discord.service';
import { PrismaService } from '../../providers/prisma/prisma.service';
import { AuthContext } from '../auth/auth.context';

@Injectable()
export class ServicesService {
  services: Service[];

  @Inject(PrismaService)
  private _prismaService: PrismaService;

  @Inject(AuthContext)
  private _authContext: AuthContext;

  @Inject(forwardRef(() => DiscordService))
  private _discordService: DiscordService;

  constructor() {
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
          ...service.serviceMetadata,
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

  public getTrigger(id: IdOf<Trigger>): Trigger {
    return this.services
      .map((service) => service.nodes)
      .flat()
      .find((node) => node.id === id && node.type == 'trigger') as Trigger;
  }

  public getAction(id: IdOf<Trigger>): Action {
    return this.services
      .map((service) => service.nodes)
      .flat()
      .find((node) => node.id === id && node.type == 'action') as Action;
  }
}
