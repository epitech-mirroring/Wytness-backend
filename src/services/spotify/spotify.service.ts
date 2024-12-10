import { Inject, Injectable } from '@nestjs/common';
import { ServiceWithOAuth } from 'src/types/services/service.type';
import { ConfigService } from '@nestjs/config';
import { PlayingMusicTrigger } from './nodes/triggers/status/playing.trigger';
import { PausePlaybackAction } from './nodes/actions/player/pause.action';
import { WorkflowsService } from '../../modules/workflows/workflows.service';


@Injectable()
export class SpotifyService extends ServiceWithOAuth {
  @Inject()
  private readonly _configService: ConfigService;

  @Inject(WorkflowsService)
  private _w: WorkflowsService;

  constructor(
    private _playingMusic: PlayingMusicTrigger,
    private _pausePlayback: PausePlaybackAction,
  ) {
    super(
      'spotify',
      'Integrate Wytness with your spotify account',
      [_playingMusic, _pausePlayback],
      {
        authorize: 'https://accounts.spotify.com/authorize',
        token: 'https://accounts.spotify.com/api/token',
      },
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
    return ['user-read-private', 'user-read-email', 'user-read-playback-state', 'user-modify-playback-state'];
  }
}
