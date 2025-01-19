import { forwardRef, Module } from '@nestjs/common';
import { SpotifyService } from './spotify.service';
import { AuthModule } from '../../modules/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { PlayingMusicTrigger } from './nodes/triggers/status/playing.trigger';
import { PausePlaybackAction } from './nodes/actions/player/pause.action';
import { WorkflowsModule } from '../../modules/workflows/workflows.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Node, Service, ServiceUser } from '../../types/services';
import { User } from '../../types/user';

@Module({
  imports: [
    AuthModule,
    ConfigModule,
    forwardRef(() => WorkflowsModule),
    TypeOrmModule.forFeature([Service, User, Node, ServiceUser]),
  ],
  providers: [SpotifyService, PlayingMusicTrigger, PausePlaybackAction],
  exports: [SpotifyService, PlayingMusicTrigger, PausePlaybackAction],
})
export class SpotifyModule {}
