import { Node } from './node.type';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { Trigger } from './trigger.type';
import { ServiceConnectDTO } from '../../dtos/services/services.dto';
import { User } from '../user';
import {
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  PrimaryColumn,
  Repository,
} from 'typeorm';
import { Code } from './code.type';
import { ServiceUser } from './connection.type';
import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { WorkflowExecutionTrace } from '../workflow';
import { base64_urlencode } from '../global';
import { InjectRepository } from '@nestjs/typeorm';

export class ServiceMetadata {
  @Column('boolean')
  useCron: boolean;
  @Column('text', { nullable: true })
  useAuth: undefined | 'OAuth' | 'code';
  @Column('text', { default: '#FFFFFF' })
  color: string;
  @Column('boolean', { default: false })
  useWebhooks: boolean;
}

export const DefaultServiceMetadata: ServiceMetadata = {
  useCron: false,
  useAuth: undefined,
  color: '#FFFFFF',
  useWebhooks: false,
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
@Entity('services')
export abstract class Service implements OnModuleInit {
  @PrimaryColumn('text')
  name: string;
  @Column('text')
  description: string;
  @JoinColumn()
  @OneToMany(() => Node, (node) => node.service)
  nodes: Node[];
  @Column(() => ServiceMetadata)
  serviceMetadata: ServiceMetadata;
  @JoinColumn()
  @OneToMany(() => ServiceUser, (serviceUser) => serviceUser.service)
  linkedUsers: ServiceUser[];

  protected constructor(
    name: string,
    description: string,
    nodes: Node[],
    serviceMetadata: ServiceMetadata = DefaultServiceMetadata,
  ) {
    this.name = name;
    this.description = description;
    this.nodes = nodes;
    this.serviceMetadata = serviceMetadata || DefaultServiceMetadata;
  }

  @InjectRepository(Service)
  private _serviceRepository: Repository<Service>;

  @InjectRepository(Node)
  private _nodeRepository: Repository<Node>;

  async onModuleInit(): Promise<void> {
    let service = await this._serviceRepository.findOne({
      where: {
        name: this.name,
      },
      relations: ['nodes'],
    });

    if (service === null) {
      await this._serviceRepository.save({
        name: this.name,
        description: this.description,
        serviceMetadata: this.serviceMetadata,
      });

      service = await this._serviceRepository.findOne({
        where: {
          name: this.name,
        },
        relations: ['nodes'],
      });
    } else {
      await this._serviceRepository.update(
        {
          name: this.name,
        },
        {
          description: this.description,
          serviceMetadata: this.serviceMetadata,
        },
      );

      service = await this._serviceRepository.findOne({
        where: {
          name: this.name,
        },
        relations: ['nodes'],
      });
    }

    // Check if there is a mismatch between the nodes in the database and the nodes in the service
    for (const node of this.nodes) {
      const dbNode = service.nodes.find((n) => n.getName() === node.getName());
      if (!dbNode) {
        const result = await this._nodeRepository.save({
          name: node.getName(),
          description: node.getDescription(),
          type: node.type,
          service: {
            name: this.name,
          },
          labels: node.labels,
        });
        node.id = result.id;
      }
    }

    for (const node of service.nodes) {
      const localNode = this.nodes.find((n) => n.getName() === node.name);
      if (!localNode) {
        await this._nodeRepository.delete({
          id: node.id,
        });
        continue;
      }
      localNode.id = node.id;
    }
    for (const node of this.nodes) {
      node.service = this;
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

  protected fetch = async (
    trace: WorkflowExecutionTrace | null,
    url: string,
    options?: RequestInit,
  ): Promise<Response> => {
    if (!trace) {
      return fetch(url, options);
    }
    let sentSize = 0;
    if (options) {
      for (const key in options.headers) {
        sentSize += key.length + options.headers[key].length;
      }
      if (options.body) {
        if (typeof options.body === 'string') {
          sentSize += options.body.length;
        } else {
          sentSize += JSON.stringify(options.body).length;
        }
      }
    }
    const response = await fetch(url, options).then((response) => {
      trace.statistics.dataUsed.upload += sentSize;
      return response;
    });
    const duplicate = response.clone();
    const body = await duplicate.text();
    let receivedSize = body.length;
    for (const key in response.headers) {
      receivedSize += key.length + response.headers[key].length;
    }
    trace.statistics.dataUsed.download += receivedSize;
    return response;
  };

  public toJSON() {
    return {
      name: this.name,
      description: this.description,
      nodes: this.nodes.map((node) => node.toJSON(false)),
      serviceMetadata: this.serviceMetadata,
    };
  }

  public stringify() {
    return JSON.stringify(this.toJSON());
  }

  public toString() {
    return this.stringify();
  }
}

export type OAuthEndpoints = {
  authorize: string;
  token: string;
};

export type OAuthConfig = {
  clientId: string;
  scopes: string;
  scopesSeparator?: string;
  state?: string;
};

export const OAuthDefaultConfig: OAuthConfig = {
  clientId: 'client_id',
  scopes: 'scope',
  state: 'state',
};

@Injectable()
export abstract class ServiceWithAuth extends Service {
  protected constructor(
    name: string,
    description: string,
    nodes: Node[],
    serviceMetadata: ServiceMetadata,
  ) {
    console.assert(serviceMetadata.useAuth);
    super(name, description, nodes, serviceMetadata);
  }

  @InjectRepository(ServiceUser)
  protected _serviceUserRepository: Repository<ServiceUser>;

  public abstract isUserConnected(userId: number): Promise<boolean>;

  public async disconnectUser(userId: number): Promise<boolean> {
    return !!(await this._serviceUserRepository.delete({
      user: {
        id: userId,
      },
      service: {
        name: this.getName(),
      },
    }));
  }
}

@Injectable()
export abstract class ServiceWithOAuth extends ServiceWithAuth {
  endpoints: OAuthEndpoints;
  config: OAuthConfig;

  protected constructor(
    name: string,
    description: string,
    nodes: Node[],
    endpoint: OAuthEndpoints,
    config: OAuthConfig = OAuthDefaultConfig,
    serviceMetadata: Omit<ServiceMetadata, 'useAuth'> = DefaultServiceMetadata,
  ) {
    super(name, description, nodes, {
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

  codeVerifiers: { [key: string]: string } = {};

  public async onOAuthCallback(
    { code, state }: ServiceConnectDTO,
    user: User,
  ): Promise<void> {
    if (!this.codeVerifiers[state]) {
      throw new Error('Invalid state');
    }
    const bodyContent: any = {};
    bodyContent[this.config.clientId] = this.getClientId();
    bodyContent['client_secret'] = this.getClientSecret();
    bodyContent['code'] = code;
    bodyContent['code_verifier'] = this.codeVerifiers[state];
    bodyContent['grant_type'] = 'authorization_code';
    bodyContent['redirect_uri'] = this.getRedirectUri();
    bodyContent[this.config.scopes] = this.getScopes().join(' ');

    const result = await fetch(this.endpoints.token, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${btoa(`${this.getClientId()}:${this.getClientSecret()}`)}`,
      },
      body: new URLSearchParams(bodyContent).toString(),
    });

    if (!result.ok) {
      this.error('Failed to fetch token', await result.text());
      throw new Error('Failed to fetch token');
    }

    const data = await result.json();

    await this._serviceUserRepository.save({
      user: {
        id: user.id,
      },
      customData: this.parseTokenResponse(data),
      service: {
        name: this.getName(),
      },
    });

    delete this.codeVerifiers[state];

    this.afterLogin(user);
  }

  public async refreshAccessToken(userId: number): Promise<void> {
    const serviceUser = await this._serviceUserRepository.findOne({
      where: {
        user: {
          id: userId,
        },
        service: {
          name: this.getName(),
        },
      },
    });

    if (!serviceUser) {
      throw new Error('User is not connected to this service');
    }

    const customData = serviceUser.customData as {
      refreshToken: string;
    };

    const bodyContent: any = {};
    bodyContent[this.config.clientId] = this.getClientId();
    bodyContent['client_secret'] = this.getClientSecret();
    bodyContent['refresh_token'] = customData.refreshToken;
    bodyContent['grant_type'] = 'refresh_token';
    bodyContent['redirect_uri'] = this.getRedirectUri();
    bodyContent[this.config.scopes] = this.getScopes().join(' ');

    const result = await fetch(this.endpoints.token, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${btoa(`${this.getClientId()}:${this.getClientSecret()}`)}`,
      },
      body: new URLSearchParams(bodyContent).toString(),
    });

    if (!result.ok) {
      this.error('Failed to fetch token', await result.text());
      throw new Error('Failed to fetch token');
    }

    const data = await result.json();

    await this._serviceUserRepository.update(
      {
        user: {
          id: userId,
        },
        service: {
          name: this.getName(),
        },
      },
      {
        customData: this.parseTokenResponse(data),
      },
    );
  }

  public async buildOAuthUrl(userId: number): Promise<string> {
    const state = `${userId}-${Date.now()}-${Math.random()}`;
    const code_verifier = base64_urlencode(
      crypto.getRandomValues(new Uint8Array(32)),
    );
    const hashed = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(code_verifier),
    );
    const code_challenge = base64_urlencode(hashed);
    this.codeVerifiers[state] = code_verifier;
    const code_challenge_method = 'S256';
    return `${this.endpoints.authorize}?${this.config.clientId}=${this.getClientId()}&redirect_uri=${encodeURI(this.getRedirectUri())}&response_type=code&${this.config.scopes}=${encodeURI(this.getScopes().join(this.config.scopesSeparator || ' '))}&${this.config.state}=${state}&code_challenge=${code_challenge}&code_challenge_method=${code_challenge_method}`;
  }

  public afterLogin(user: User): void {
    void user;
    return;
  }

  public async isUserConnected(userId: number): Promise<boolean> {
    return !!(await this._serviceUserRepository.findOne({
      where: {
        user: {
          id: userId,
        },
        service: {
          name: this.getName(),
        },
      },
    }));
  }

  public async fetchWithOAuth(
    user: User,
    trace: WorkflowExecutionTrace | null,
    url: string,
    options: RequestInit = {},
  ): Promise<Response> {
    const serviceUser = await this._serviceUserRepository.findOne({
      where: {
        user: {
          id: user.id,
        },
        service: {
          name: this.getName(),
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

    const result = await this.fetch(trace, url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `${customData.tokenType} ${customData.accessToken}`,
      },
    });
    if (!result.ok) {
      if (result.status === 401) {
        await this.refreshAccessToken(user.id);
        return this.fetchWithOAuth(user, trace, url, options);
      }
      this.error(result.status, await result.text());
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
    serviceMetadata: Omit<ServiceMetadata, 'useAuth'> = DefaultServiceMetadata,
  ) {
    super(name, description, nodes, {
      ...serviceMetadata,
      useAuth: 'code',
    });
  }

  @InjectRepository(Code)
  private _codeRepository: Repository<Code>;

  async isUserConnected(userId: number): Promise<boolean> {
    return !!(await this._serviceUserRepository.findOne({
      where: {
        user: {
          id: userId,
        },
        service: {
          name: this.getName(),
        },
      },
    }));
  }

  public abstract getForm(): CodeForm;

  public abstract generateCode(userId: number, formData: any): Promise<number>;

  protected async _generateCode(
    userId: number,
    customData?: any,
  ): Promise<number> {
    if (await this.isUserConnected(userId)) {
      throw new Error('User is not connected to this service');
    }
    const exist =
      (
        await this._codeRepository.find({
          where: {
            user: {
              id: userId,
            },
            source: this.getName(),
          },
        })
      ).length > 0;

    if (exist) {
      throw new Error('User already has a code');
    }

    const code = Math.floor(100_000 + Math.random() * 999_999);
    await this._codeRepository.save({
      code,
      user: {
        id: userId,
      },
      source: this.getName(),
      customData,
    });
    return code;
  }

  public async getCode(userId: number): Promise<number | undefined> {
    const code = await this._codeRepository.findOne({
      where: {
        user: {
          id: userId,
        },
        source: this.getName(),
      },
    });

    if (!code) {
      return undefined;
    }

    return code.code;
  }

  public async verifyCode(userId: number, code: number): Promise<boolean> {
    const exist = await this._codeRepository.findOne({
      where: {
        code,
        user: {
          id: userId,
        },
        source: this.getName(),
      },
    });

    if (!exist) {
      return false;
    }

    await this._codeRepository.delete({
      code,
      user: {
        id: userId,
      },
      source: this.getName(),
    });

    await this._serviceUserRepository.save({
      customData: exist.customData,
      user: {
        id: userId,
      },
      service: {
        name: this.getName(),
      },
    });
    return true;
  }
}

@ApiSchema({
  name: 'Service',
  description: 'Service entity',
})
export class ListService {
  @ApiProperty({
    description:
      'The name of the service, is unique and can be used to identify the service',
    example: 'Service',
  })
  name: string;
  @ApiProperty({
    description: 'An url toward the logo of the service',
    example: 'https://example.com/logo.png',
  })
  logo: string;
  @ApiProperty({
    description: 'The description of the service',
    example: 'Service description',
  })
  description: string;
}

export interface ServiceWithWebhooks extends Service {
  onWebhookCalled(id: string, data: any, user: User): Promise<void>;
}
