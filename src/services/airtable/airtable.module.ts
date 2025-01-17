import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from '../../modules/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { WorkflowsModule } from '../../modules/workflows/workflows.module';
import { DatabaseModule } from '../../providers/database/database.module';
import {
  serviceNodeProviders,
  serviceProviders,
  serviceUserProviders,
} from '../../providers/database/providers/service.providers';
import { AirtableService } from './airtable.service';
import { ListRecordsAction } from './nodes/actions/records/list-records.action';
import { ListBasesAction } from './nodes/actions/bases/list-bases.action';
import { GetBaseSchemaAction } from './nodes/actions/bases/get-base-schema.action';
import { GetOneRecordAction } from './nodes/actions/records/get-one-record.action';
import { UpdateRecordAction } from './nodes/actions/records/update-record.action';
import { DeleteRecordAction } from './nodes/actions/records/delete-record.action';

@Module({
  imports: [
    AuthModule,
    ConfigModule,
    forwardRef(() => WorkflowsModule),
    DatabaseModule,
  ],
  providers: [
    AirtableService,
    ...serviceProviders,
    ...serviceUserProviders,
    ...serviceNodeProviders,
    ListRecordsAction,
    ListBasesAction,
    GetBaseSchemaAction,
    GetOneRecordAction,
    UpdateRecordAction,
    DeleteRecordAction,
  ],
  exports: [AirtableService],
})
export class AirtableModule {}
