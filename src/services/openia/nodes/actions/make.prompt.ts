import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Action, Field, FieldType } from '../../../../types/services';
import { WorkflowExecutionTrace } from '../../../../types/workflow';
import { WorkflowsService } from '../../../../modules/workflows/workflows.service';
import { ExecutionsService } from '../../../../modules/workflows/executions.service';

@Injectable()
export class OpenAIAction extends Action {
  @Inject()
  private readonly _configService: ConfigService;

  @Inject(forwardRef(() => WorkflowsService))
  public _w: WorkflowsService;

  @Inject(forwardRef(() => ExecutionsService))
  public _executions: ExecutionsService;

  constructor() {
    super(
      'OpenAI',
      'Send a prompt to OpenAI GPT model and get a response',
      ['output'],
      [
        new Field(
          'Prompt',
          'prompt',
          'The prompt to send to OpenAI',
          FieldType.STRING,
          false,
        ),
        new Field(
          'API Key',
          'key',
          'The API Key for OpenAI',
          FieldType.NUMBER,
          false,
        ),
      ],
    );
  }

  async execute(
    _outputLabel: string,
    _config: any,
    trace: WorkflowExecutionTrace,
  ): Promise<any> {
    const prompt = trace.processPipelineString(trace.config.prompt);
    const temperature = 0.7;
    const apiKey = trace.processPipelineString(trace.config.key);

    if (!prompt) {
      this.error(trace, 'Prompt is required');
      return;
    }

    if (!apiKey) {
      this.error(trace, 'API Key is required');
      return;
    }

    const url = 'https://api.openai.com/v1/chat/completions';
    const headers = {
      'Content-Type': 'application/json',
      'OpenAI-Organization': 'org-NKnFgQCDmEKqbZ31P2HSAwQ9',
      'OpenAI-Project': 'proj_rbA5SQkM4K09QvUDGzcbef0m',
      Authorization: `Bearer ${apiKey}`,
    };

    const data = {
      model: 'gpt-4o-mini', // You can change this to another model like GPT-4 if needed
      messages: [{ role: 'system', content: prompt }],
      max_tokens: 150,
      temperature: temperature,
    };

    const res = await this.fetch(trace, url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      this.error(trace, 'Failed to fetch response from OpenAI');
      console.log(await res.json());
      return;
    }

    const resJson = await res.json();
    return {
      response: resJson.choices[0].message.content,
    };
  }

  getExecutionService(): ExecutionsService {
    return this._executions;
  }

  getWorkflowService(): WorkflowsService {
    return this._w;
  }
}
