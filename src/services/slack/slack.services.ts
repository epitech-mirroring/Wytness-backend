import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { ServiceWithOAuth } from 'src/types/services/service.type';
import { ConfigService } from '@nestjs/config';
import { WorkflowsService } from '../../modules/workflows/workflows.service';
import { createHmac } from 'crypto';

@Injectable()
export class SlackServices extends ServiceWithOAuth {
  @Inject()
  private readonly _configService: ConfigService;

  @Inject(forwardRef(() => WorkflowsService))
  private _w: WorkflowsService;

  constructor() {
    super(
      'slack',
      'Integrate Wytness with your slack account',
      [],
      {
        authorize: 'https://slack.com/oauth/v2/authorize',
        token: 'https://slack.com/api/oauth.v2.access',
      },
      { clientId: 'client_id', scopes: 'user_scope' },
    );
  }

  getClientId(): string {
    return this._configService.get<string>('SLACK_CLIENT_ID');
  }

  getClientSecret(): string {
    return this._configService.get<string>('SLACK_CLIENT_SECRET');
  }

  parseTokenResponse(data: any): any {
    return {
      accessToken: data.authed_user.access_token,
      tokenType: data.authed_user.token_type,
      scope: data.authed_user.scope,
      expiresIn: data.authed_user.expires_in,
    };
  }

  getRedirectUri(): string {
    return 'http://localhost:3000/services/slack/connect';
  }

  getScopes(): string[] {
    return ['identify', 'channels:read'];
  }

  verifyRequest(signature: string, timestamp: string, body: any): boolean {
    const slackSigningSecret = this._configService.get<string>(
      'SLACK_SIGNING_SECRET',
    );
    const baseString = `v0:${timestamp}:${JSON.stringify(body)}`;
    const hmac = createHmac('sha256', slackSigningSecret);
    const hash = `v0=${hmac.update(baseString).digest('hex')}`;

    return hash === signature;
  }

  async processEvent(event: any) {
    // Process the event from Slack
    console.log('Received event:', event);
    // Add your event handling logic here
  }
}
