import { ListNode, Node } from './node.type';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { Trigger } from './trigger.type';
import { ServiceConnectDTO } from '../../dtos/services/services.dto';
import { PrismaService } from '../../providers/prisma/prisma.service';
import { User } from '../user';

export type ServiceMetadata = {
  useCron: boolean;
  useAuth: undefined | 'OAuth' | 'code';
};

export type CodeFormField = {
  type: 'text' | 'number' | 'email' | 'password';
  name: string;
  description: string;
  placeholder?: string;
  required?: boolean;
};
export type CodeForm = Array<CodeFormField>;

@Injectable()
export abstract class Service implements OnModuleInit {
  id: number;
  name: string;
  description: string;
  logo: string;
  nodes: Node[];
  serviceMetadata: ServiceMetadata;

  @Inject()
  protected _prismaService: PrismaService;

  protected constructor(
    name: string,
    description: string,
    nodes: Node[],
    logo: string,
    serviceMetadata?: ServiceMetadata,
  ) {
    this.name = name;
    this.description = description;
    this.nodes = nodes;
    this.serviceMetadata = serviceMetadata || {
      useAuth: undefined,
      useCron: false,
    };
    this.logo = logo;
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
          logo: this.logo,
          nodes: {
            create: this.nodes.map((node) => ({
              name: node.getName(),
              type: node.type === 'trigger' ? 'TRIGGER' : 'ACTION',
              fields: {
                create: node.getFields().map((field) => ({
                  name: field.name,
                  title: field.title,
                  description: field.description,
                  type: field.type,
                  nullable: field.nullable,
                })),
              },
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
            fields: {
              create: node.getFields().map((field) => ({
                name: field.name,
                title: field.title,
                description: field.description,
                type: field.type,
                nullable: field.nullable,
              })),
            },
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

export type OAuthConfig = {
  clientId: string;
  scopes: string;
};

export const OAuthDefaultConfig: OAuthConfig = {
  clientId: 'client_id',
  scopes: 'scopes',
};

@Injectable()
export abstract class ServiceWithAuth extends Service {
  protected constructor(
    name: string,
    description: string,
    nodes: Node[],
    logo: string,
    serviceMetadata: ServiceMetadata,
  ) {
    console.assert(serviceMetadata.useAuth);
    super(name, description, nodes, logo, serviceMetadata);
  }

  public abstract isUserConnected(userId: number): Promise<boolean>;
}

@Injectable()
export abstract class ServiceWithOAuth extends ServiceWithAuth {
  endpoints: OAuthEndpoints;
  config: OAuthConfig;

  protected constructor(
    name: string,
    description: string,
    nodes: Node[],
    logo: string,
    endpoint: OAuthEndpoints,
    config: OAuthConfig = OAuthDefaultConfig,
    serviceMetadata?: Omit<ServiceMetadata, 'useAuth'>,
  ) {
    super(name, description, nodes, logo, {
      ...serviceMetadata,
      useAuth: 'OAuth',
    });
    this.endpoints = endpoint;
    this.config = config;
  }

  public getEndpoints(): OAuthEndpoints {
    return this.endpoints;
  }

  public parseTokenResponse(data: any): any {
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      tokenType: data.token_type,
      scope: data.scope,
      expiresIn: data.expires_in,
    };
  }

  public async onOAuthCallback(
    { code }: ServiceConnectDTO,
    user: Omit<User, 'actions'>,
  ): Promise<void> {
    const bodyContent: any = {};
    bodyContent[this.config.clientId] = this.getClientId();
    bodyContent['client_secret'] = this.getClientSecret();
    bodyContent['code'] = code;
    bodyContent['grant_type'] = 'authorization_code';
    bodyContent['redirect_uri'] = this.getRedirectUri();
    bodyContent[this.config.scopes] = this.getScopes().join(' ');

    const result = await fetch(this.endpoints.token, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(bodyContent).toString(),
    });

    if (!result.ok) {
      this.error('Failed to fetch token', await result.text());
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
        customData: this.parseTokenResponse(data),
        service: {
          connect: {
            name: this.getName(),
          },
        },
      },
    });
  }

  public buildOAuthUrl(): string {
    return `${this.endpoints.authorize}?${this.config.clientId}=${this.getClientId()}&redirect_uri=${this.getRedirectUri()}&response_type=code&${this.config.scopes}=${this.getScopes().join(' ')}`;
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
      this.error(result.status);
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
      `[${new Date().toISOString()}] [${this.name[0].toUpperCase() + this.name.slice(1)}/INFO] `,
      msg,
      ...args,
    );
  }

  protected error(msg: any, ...args: any[]): void {
    console.error(
      `[${new Date().toISOString()}] [${this.name[0].toUpperCase() + this.name.slice(1)}/ERROR] `,
      msg,
      ...args,
    );
  }

  protected warn(msg: any, ...args: any[]): void {
    console.warn(
      `[${new Date().toISOString()}] [${this.name[0].toUpperCase() + this.name.slice(1)}/WARN] `,
      msg,
      ...args,
    );
  }

  protected debug(msg: any, ...args: any[]): void {
    console.debug(
      `[${new Date().toISOString()}] [${this.name[0].toUpperCase() + this.name.slice(1)}/DEBUG] `,
      msg,
      ...args,
    );
  }
}

@Injectable()
export abstract class ServiceWithCode extends ServiceWithAuth {
  protected constructor(
    name: string,
    description: string,
    nodes: Node[],
    logo: string,
    serviceMetadata?: Omit<ServiceMetadata, 'useAuth'>,
  ) {
    super(name, description, nodes, logo, {
      ...serviceMetadata,
      useAuth: 'code',
    });
  }

  async isUserConnected(userId: number): Promise<boolean> {
    const result = await this._prismaService.serviceUser.findFirst({
      where: {
        userId,
        serviceId: this.id,
      },
    });
    return !!result;
  }

  public abstract getForm(): CodeForm;

  public abstract generateCode(userId: number, formData): Promise<number>;

  protected async _generateCode(
    userId: number,
    customData?: any,
  ): Promise<number> {
    if (await this.isUserConnected(userId)) {
      throw new Error('User is not connected to this service');
    }
    const exist =
      (
        await this._prismaService.code.findMany({
          where: {
            userId,
            source: this.getName(),
          },
        })
      ).length > 0;

    if (exist) {
      throw new Error('User already has a code');
    }

    const code = Math.floor(100_000 + Math.random() * 999_999);
    await this._prismaService.code.create({
      data: {
        code,
        userId,
        source: this.getName(),
        customData,
      },
    });
    return code;
  }

  public async getCode(userId: number): Promise<number | undefined> {
    const code = await this._prismaService.code.findFirst({
      where: {
        userId,
        source: this.getName(),
      },
    });

    if (!code) {
      return undefined;
    }

    return code.code;
  }

  public async verifyCode(userId: number, code: number): Promise<boolean> {
    const exist = await this._prismaService.code.findFirst({
      where: {
        userId,
        source: this.getName(),
        code,
      },
    });

    if (!exist) {
      return false;
    }

    const authcode = await this._prismaService.code.delete({
      where: {
        id: exist.id,
      },
    });

    await this._prismaService.serviceUser.create({
      data: {
        customData: authcode.customData,
        user: {
          connect: {
            id: userId,
          },
        },
        service: {
          connect: {
            id: this.id,
          },
        },
      },
    });
    return true;
  }
}

export type ListService = {
  id: number;
  name: string;
  logo: string;
  description: string;
  nodes: ListNode[];
} & ServiceMetadata;
