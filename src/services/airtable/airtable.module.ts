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
  ],
  exports: [AirtableService],
})
export class AirtableModule {}
