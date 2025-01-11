import { forwardRef, Inject, Injectable } from '@nestjs/common';
import {
  OAuthDefaultConfig,
  ServiceWithOAuth,
} from 'src/types/services/service.type';
import { ConfigService } from '@nestjs/config';
import { PlayingMusicTrigger } from './nodes/triggers/status/playing.trigger';
import { PausePlaybackAction } from './nodes/actions/player/pause.action';
import { WorkflowsService } from '../../modules/workflows/workflows.service';

@Injectable()
export class SpotifyService extends ServiceWithOAuth {
  @Inject()
  private readonly _configService: ConfigService;

  @Inject(forwardRef(() => WorkflowsService))
  private _w: WorkflowsService;

  constructor(
    private _playingMusic: PlayingMusicTrigger,
    private _pausePlayback: PausePlaybackAction,
  ) {
    super(
      'spotify',
      'Spotify - A digital music, podcast, and video streaming service',
      [_playingMusic, _pausePlayback],
      'https://storage.googleapis.com/pr-newsroom-wp/1/2023/05/Spotify_Primary_Logo_RGB_Green.png',
      {
        authorize: 'https://accounts.spotify.com/authorize',
        token: 'https://accounts.spotify.com/api/token',
      },
      OAuthDefaultConfig,
      { useCron: true },
    );
  }

  getClientId(): string {
    return this._configService.get<string>('SPOTIFY_CLIENT_ID');
  }

  getClientSecret(): string {
    return this._configService.get<string>('SPOTIFY_CLIENT_SECRET');
  }

  getRedirectUri(): string {
    if (process.env.NODE_ENV === 'production') {
      return 'https://wytness.com/services/spotify/connect';
    }
    return 'http://localhost:3000/services/spotify/connect';
  }

  getScopes(): string[] {
    return [
      'user-read-private',
      'user-read-email',
      'user-read-playback-state',
      'user-modify-playback-state',
    ];
  }
}
