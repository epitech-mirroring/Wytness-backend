import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WorkflowsService } from '../../modules/workflows/workflows.service';
import { OAuthDefaultConfig, ServiceWithOAuth } from '../../types/services';
import { ListRecordsAction } from './nodes/actions/records/list-records.action';
import { ListBasesAction } from './nodes/actions/bases/list-bases.action';
import { GetBaseSchemaAction } from './nodes/actions/bases/get-base-schema.action';
import { GetOneRecordAction } from './nodes/actions/records/get-one-record.action';

@Injectable()
export class AirtableService extends ServiceWithOAuth {
  @Inject()
  private readonly _configService: ConfigService;

  @Inject(forwardRef(() => WorkflowsService))
  private _w: WorkflowsService;

  constructor(
    @Inject()
    private readonly _listRecordsAction: ListRecordsAction,
    @Inject()
    private readonly _listBasesAction: ListBasesAction,
    @Inject()
    private readonly _getBaseSchemaAction: GetBaseSchemaAction,
    @Inject()
    private readonly _getOneRecordAction: GetOneRecordAction,
  ) {
    super(
      'airtable',
      'Airtable - Manage databases with a spreadsheet interface',
      [
        _listRecordsAction,
        _listBasesAction,
        _getBaseSchemaAction,
        _getOneRecordAction,
      ],
      {
        token: 'https://airtable.com/oauth2/v1/token',
        authorize: 'https://airtable.com/oauth2/v1/authorize',
      },
      OAuthDefaultConfig,
      {
        color: '#FFFFFF',
        useCron: false,
      },
    );
  }

  getClientId(): string {
    return this._configService.get<string>('AIRTABLE_CLIENT_ID');
  }

  getClientSecret(): string {
    return this._configService.get<string>('AIRTABLE_CLIENT_SECRET');
  }

  getRedirectUri(): string {
    if (process.env.NODE_ENV === 'production') {
      return 'https://wytness.fr/services/airtable/connect';
    }
    return 'http://127.0.0.1:3000/services/airtable/connect';
  }

  getScopes(): string[] {
    return [
      'data.records:read',
      'data.records:write',
      'schema.bases:read',
      'schema.bases:write',
      'webhook:manage',
    ];
  }
}
