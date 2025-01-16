import { forwardRef, Module } from '@nestjs/common';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';
import { AuthModule } from '../auth/auth.module';
import { DiscordModule } from '../../services/discord/discord.module';
import { SpotifyModule } from '../../services/spotify/spotify.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { FlowControlModule } from '../../services/flow_control/flow-control.module';
import { AirtableModule } from '../../services/airtable/airtable.module';

@Module({
  imports: [
    AuthModule,
    PermissionsModule,
    forwardRef(() => DiscordModule),
    forwardRef(() => SpotifyModule),
    forwardRef(() => FlowControlModule),
    forwardRef(() => AirtableModule),
  ],
  providers: [ServicesService],
  controllers: [ServicesController],
  exports: [ServicesService],
})
export class ServicesModule {}
