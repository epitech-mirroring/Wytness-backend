import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { ServiceWithOAuth } from 'src/types/services/service.type';
import { ConfigService } from '@nestjs/config';
import { WorkflowsService } from '../../modules/workflows/workflows.service';

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

  parseTokenResponse(data: any): any {
    return {
      accessToken: data.authed_user.access_token,
      tokenType: data.authed_user.token_type,
      scope: data.authed_user.scope,
      expiresIn: data.authed_user.expires_in,
    };
  }

  getClientSecret(): string {
    return this._configService.get<string>('SLACK_CLIENT_SECRET');
  }

  getRedirectUri(): string {
    return 'http://localhost:3000/services/slack/connect';
  }

  getScopes(): string[] {
    return ['identify', 'channels:read'];
  }
}
