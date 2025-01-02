import { ListNode, Node } from './node.type';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { Trigger } from './trigger.type';
import { ServiceConnectDTO } from '../../dtos/services/services.dto';
import { PrismaService } from '../../providers/prisma/prisma.service';
import { User } from '../user';

export type ServiceMetadata = {
  useOAuth: boolean;
  useCron: boolean;
};

@Injectable()
export abstract class Service implements OnModuleInit {
  id: number;
  name: string;
  description: string;
  nodes: Node[];
  serviceMetadata: ServiceMetadata;

  @Inject()
  protected _prismaService: PrismaService;

  protected constructor(
    name: string,
    description: string,
    nodes: Node[],
    serviceMetadata?: ServiceMetadata,
  ) {
    this.name = name;
    this.description = description;
    this.nodes = nodes;
    this.serviceMetadata = serviceMetadata || {
      useOAuth: false,
      useCron: false,
    };
  }

  async onModuleInit(): Promise<void> {
    let service = await this._prismaService.service.findUnique({
      where: { name: this.name },
      include: {
        nodes: true,
      },
    });

    if (service === null) {
      await this._prismaService.service.create({
        data: {
          name: this.name,
          description: this.description,
          nodes: {
            create: this.nodes.map((node) => ({
              name: node.getName(),
              type: node.type === 'trigger' ? 'TRIGGER' : 'ACTION',
            })),
          },
        },
      });

      service = await this._prismaService.service.findUnique({
        where: { name: this.name },
        include: {
          nodes: true,
        },
      });
    }

    // Check if there is a mismatch between the nodes in the database and the nodes in the service
    for (const node of this.nodes) {
      const dbNode = service.nodes.find((n) => n.name === node.getName());
      if (!dbNode) {
        const result = await this._prismaService.node.create({
          data: {
            name: node.getName(),
            type: node.type === 'trigger' ? 'TRIGGER' : 'ACTION',
            service: {
              connect: {
                name: this.name,
              },
            },
          },
        });
        node.id = result.id;
      }
    }

    this.id = service.id;

    for (const node of service.nodes) {
      const localNode = this.nodes.find((n) => n.getName() === node.name);
      if (!localNode) {
        await this._prismaService.node.delete({
          where: {
            id: node.id,
          },
        });
        continue;
      }
      localNode.id = node.id;
    }
  }

  public getName(): string {
    return this.name;
  }

  public getDescription(): string {
    return this.description;
  }

  public getNodes(): Node[] {
    return this.nodes;
  }

  public getTriggers(): Trigger[] {
    return this.nodes.filter((node) => node.type === 'trigger') as Trigger[];
  }

  public getActions(): Node[] {
    return this.nodes.filter((node) => node.type === 'action');
  }

  public getNodeById(id: number): Node | undefined {
    return this.nodes.find((node) => node.id === id);
  }

  public needCron(): boolean {
    return this.serviceMetadata.useCron;
  }

  public findTrigger(name: string): Trigger | undefined {
    return this.getTriggers().find((trigger) => trigger.getName() === name);
  }

  public findAction(name: string): Node | undefined {
    return this.getActions().find((action) => action.getName() === name);
  }
}

export type OAuthEndpoints = {
  authorize: string;
  token: string;
};

@Injectable()
export abstract class ServiceWithOAuth extends Service {
  endpoints: OAuthEndpoints;

  protected constructor(
    name: string,
    description: string,
    nodes: Node[],
    endpoint: OAuthEndpoints,
    serviceMetadata?: Omit<ServiceMetadata, 'useOAuth'>,
  ) {
    super(name, description, nodes, {
      ...serviceMetadata,
      useOAuth: true,
    });
    this.endpoints = endpoint;
  }

  public getEndpoints(): OAuthEndpoints {
    return this.endpoints;
  }

  public async onOAuthCallback(
    { code }: ServiceConnectDTO,
    user: User,
  ): Promise<void> {
    const result = await fetch(this.endpoints.token, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.getClientId(),
        client_secret: this.getClientSecret(),
        code,
        grant_type: 'authorization_code',
        redirect_uri: this.getRedirectUri(),
        scope: this.getScopes().join(' '),
      }).toString(),
    });

    if (!result.ok) {
      throw new Error('Failed to fetch token');
    }

    const data = await result.json();

    await this._prismaService.serviceUser.create({
      data: {
        user: {
          connect: {
            id: user.id,
          },
        },
        customData: {
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          tokenType: data.token_type,
          scope: data.scope,
          expiresIn: data.expires_in,
        },
        service: {
          connect: {
            name: this.getName(),
          },
        },
      },
    });
  }

  public buildOAuthUrl(): string {
    return `${this.endpoints.authorize}?client_id=${this.getClientId()}&redirect_uri=${this.getRedirectUri()}&response_type=code&scope=${this.getScopes().join(' ')}`;
  }

  public afterLogin(): void {}

  public async isUserConnected(userId: number): Promise<boolean> {
    return !!(await this._prismaService.serviceUser.findUnique({
      where: {
        serviceId_userId: {
          userId,
          serviceId: this.id,
        },
      },
    }));
  }

  public async fetchWithOAuth(
    user: User,
    url: string,
    options: RequestInit = {},
  ): Promise<Response> {
    const serviceUser = await this._prismaService.serviceUser.findUnique({
      where: {
        serviceId_userId: {
          userId: user.id,
          serviceId: this.id,
        },
      },
    });

    if (!serviceUser) {
      throw new Error('User is not connected to this service');
    }

    const customData = serviceUser.customData as {
      accessToken: string;
      tokenType: string;
    };

    const result = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `${customData.tokenType} ${customData.accessToken}`,
      },
    });

    if (!result.ok) {
      throw new Error('Failed to fetch data');
    }

    return result;
  }

  abstract getClientId(): string;
  abstract getClientSecret(): string;
  abstract getScopes(): string[];
  abstract getRedirectUri(): string;

  protected info(msg: any, ...args: any[]): void {
    console.info(
      `[${new Date().toISOString()}] [${this.name[0].toUpperCase() + this.name.slice(1)}/INFO] ${msg}`,
      ...args,
    );
  }

  protected error(msg: any, ...args: any[]): void {
    console.error(
      `[${new Date().toISOString()}] [${this.name[0].toUpperCase() + this.name.slice(1)}/ERROR] ${msg}`,
      ...args,
    );
  }

  protected warn(msg: any, ...args: any[]): void {
    console.warn(
      `[${new Date().toISOString()}] [${this.name[0].toUpperCase() + this.name.slice(1)}/WARN] ${msg}`,
      ...args,
    );
  }

  protected debug(msg: any, ...args: any[]): void {
    console.debug(
      `[${new Date().toISOString()}] [${this.name[0].toUpperCase() + this.name.slice(1)}/DEBUG] ${msg}`,
      ...args,
    );
  }
}

export type ListService = {
  id: number;
  name: string;
  description: string;
  nodes: ListNode[];
} & ServiceMetadata;
