import { forwardRef, Module } from '@nestjs/common';
import { SpotifyService } from './spotify.service';
import { AuthModule } from '../../modules/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { PlayingMusicTrigger } from './nodes/triggers/status/playing.trigger';
import { PausePlaybackAction } from './nodes/actions/player/pause.action';
import { WorkflowsModule } from '../../modules/workflows/workflows.module';
import { DatabaseModule } from '../../providers/database/database.module';
import {
  serviceNodeProviders,
  serviceProviders,
  serviceUserProviders,
} from '../../providers/database/providers/service.providers';

@Module({
  imports: [
    AuthModule,
    ConfigModule,
    forwardRef(() => WorkflowsModule),
    DatabaseModule,
  ],
  providers: [
    SpotifyService,
    PlayingMusicTrigger,
    PausePlaybackAction,
    ...serviceProviders,
    ...serviceUserProviders,
    ...serviceNodeProviders,
  ],
  exports: [SpotifyService, PlayingMusicTrigger, PausePlaybackAction],
})
export class SpotifyModule {}
