import { Inject, Injectable } from '@nestjs/common';
import { ServiceWithOAuth } from '../../types';
import { ConfigService } from '@nestjs/config';
import * as websocket from 'websocket';
import { DirectMessageCreatedTrigger } from './nodes/triggers/direct-messages/create.trigger';
import { DiscordMessageCreatedEvent } from './discord.type';
import { DirectMessageSendAction } from './nodes/actions/direct-messages/send.action';
import { WorkflowsService } from '../../modules/workflows/workflows.service';

export type GatewayMessage = {
  op: number;
  d: any;
  s: number;
  t: string;
};

@Injectable()
export class DiscordService extends ServiceWithOAuth {
  @Inject()
  private readonly _configService: ConfigService;

  @Inject()
  private _w: WorkflowsService;

  ws: websocket.w3cwebsocket;
  ready = false;

  constructor(
    @Inject(DirectMessageCreatedTrigger)
    private _dmNew: DirectMessageCreatedTrigger,
    @Inject(DirectMessageSendAction)
    private _dmSend: DirectMessageSendAction,
  ) {
    super(
      'discord',
      'Integrate Wytness with your discord servers',
      [_dmNew, _dmSend],
      {
        authorize: 'https://discord.com/oauth2/authorize',
        token: 'https://discord.com/api/oauth2/token',
      },
    );
  }

  getClientId(): string {
    return this._configService.get<string>('DISCORD_CLIENT_ID');
  }

  getClientSecret(): string {
    return this._configService.get<string>('DISCORD_CLIENT_SECRET');
  }

  getRedirectUri(): string {
    if (process.env.NODE_ENV === 'production') {
      return 'https://wytness.com/services/discord/connect';
    }
    return 'http://localhost:3000/services/discord/connect';
  }

  getScopes(): string[] {
    return ['identify'];
  }

  async onModuleInit(): Promise<void> {
    await super.onModuleInit();

    const gatewayUrl = (
      await (await fetch('https://discord.com/api/v9/gateway')).json()
    ).url;

    // Open a websocket connection to discord gateway
    this.ws = new websocket.w3cwebsocket(`${gatewayUrl}?v=10&encoding=json`);

    this.ws.onopen = () => {
      console.log('Connected to discord gateway');
    };

    this.ws.onmessage = (message) => {
      this.handleGatewayMessage(JSON.parse(message.data as string));
    };
  }

  private handleGatewayMessage(message: GatewayMessage): void {
    switch (message.op) {
      case 10:
        const { heartbeat_interval } = message.d as {
          heartbeat_interval: number;
        };
        setInterval(() => {
          if (this.ws.readyState !== this.ws.OPEN) {
            return;
          }
          this.ws.send(
            JSON.stringify({
              op: 1,
              d: message.s,
            }),
          );
        }, heartbeat_interval);

        this.ws.send(
          JSON.stringify({
            op: 2,
            d: {
              token: this._configService.get<string>('DISCORD_BOT_TOKEN'),
              intents: 1 << 12,
              properties: {
                $os: 'linux',
                $browser: 'wytness',
                $device: 'wytness',
              },
            },
          }),
        );
        break;
      case 0:
        if (message.t === 'READY') {
          this.ready = true;
        } else {
          this.handleEvent(message).then().catch(console.error);
        }
        break;
      default:
        console.log(message);
        break;
    }
  }

  public async handleEvent(event: GatewayMessage): Promise<void> {
    switch (event.t) {
      case 'MESSAGE_CREATE':
        const message = event.d as DiscordMessageCreatedEvent;
        if (message.author.bot) {
          return;
        }
        this._w.findAndTrigger(message, (entrypoint) => {
          if (entrypoint.nodeID === this._dmNew.id) {
            return entrypoint.config.channelId === message.channel_id;
          }
        });
        break;
      default:
        console.log(event);
        break;
    }
  }

  public getInviteUrl(): string {
    return `https://discord.com/oauth2/authorize?client_id=${this.getClientId()}&scope=bot&permissions=8`;
  }
}
