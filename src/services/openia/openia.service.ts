import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { Service } from '../../types/services';
import { WorkflowsService } from '../../modules/workflows/workflows.service';
import { ConfigService } from '@nestjs/config';
import { OpenAIAction } from './nodes/actions/make.prompt';

@Injectable()
export class OpenAIService extends Service {
  @Inject()
  private readonly _configService: ConfigService;

  @Inject(forwardRef(() => WorkflowsService))
  private _w: WorkflowsService;

  constructor(private _openAIAction: OpenAIAction) {
    super(
      'openai',
      'Integrate Wytness with OpenAI GPT models',
      [_openAIAction],
      {
        color: '#34a853',
        useCron: false,
        useAuth: undefined,
        useWebhooks: false,
      },
    );
  }
}
