import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WorkflowsService } from '../../modules/workflows/workflows.service';
import { Service } from '../../types/services';
import { IfAction } from './nodes/actions/if.action';

@Injectable()
export class FlowControlService extends Service {
  @Inject()
  private readonly _configService: ConfigService;

  @Inject(forwardRef(() => WorkflowsService))
  private _w: WorkflowsService;

  constructor(
    @Inject(IfAction)
    private _ifAction: IfAction,
  ) {
    super(
      'flow-control',
      'Control the flow of your workflows',
      [_ifAction],
      'https://storage.googleapis.com/pr-newsroom-wp/1/2023/05/Spotify_Primary_Logo_RGB_Green.png',
    );
  }
}
