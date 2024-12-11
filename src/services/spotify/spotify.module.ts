import { forwardRef, Module } from '@nestjs/common';
import { SpotifyService } from './spotify.service';
import { PrismaModule } from '../../providers/prisma/prisma.module';
import { AuthModule } from '../../modules/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { PlayingMusicTrigger } from './nodes/triggers/status/playing.trigger';
import { PausePlaybackAction } from './nodes/actions/player/pause.action';
import { WorkflowsModule } from '../../modules/workflows/workflows.module';
import { ServicesModule } from 'src/modules/services/services.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    ConfigModule,
    forwardRef(() => WorkflowsModule),
    forwardRef(() => ServicesModule),
  ],
  providers: [SpotifyService, PlayingMusicTrigger, PausePlaybackAction],
  exports: [SpotifyService, PlayingMusicTrigger, PausePlaybackAction],
})
export class SpotifyModule {}
