import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WorkflowsService } from '../../modules/workflows/workflows.service';
import { Service } from '../../types/services';
import { IfAction } from './nodes/actions/if.action';
import { ForAction } from './nodes/actions/for.action';

@Injectable()
export class FlowControlService extends Service {
  @Inject()
  private readonly _configService: ConfigService;

  @Inject(forwardRef(() => WorkflowsService))
  private _w: WorkflowsService;

  constructor(
    @Inject(IfAction)
    private _ifAction: IfAction,
    @Inject(ForAction)
    private _forAction: ForAction,
  ) {
    super(
      'flow-control',
      'Control the flow of your workflows',
      [_ifAction, _forAction],
      {
        color: '#F2BE4E',
        useCron: false,
        useAuth: undefined,
        useWebhooks: false,
      },
    );
  }
}
