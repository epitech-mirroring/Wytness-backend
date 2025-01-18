import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Action, Field, FieldType } from '../../../../types/services';
import { WorkflowsService } from '../../../../modules/workflows/workflows.service';
import { WorkflowExecutionTrace } from '../../../../types/workflow';
import { stringify } from 'ts-jest';

@Injectable()
export class WeatherAction extends Action {
  @Inject()
  private readonly _configService: ConfigService;

  @Inject(forwardRef(() => WorkflowsService))
  public _w: WorkflowsService;

  constructor() {
    super(
      'Weather',
      'Get the weather for a specific city',
      ['output'],
      [
        new Field(
          'City',
          'city',
          'The city to get the weather for',
          FieldType.STRING,
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
    const city = trace.processPipelineString(trace.config.city);
    const key = this._configService.get<string>('WEATHER_API_KEY');

    if (!city) {
      this.error(trace, 'City is required');
      return;
    }

    const res = await this.fetch(
      trace,
      `https://api.weatherapi.com/v1/current.json?key=${key}&q=${city}&aqi=no`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
    const resJson = await res.json();
    return resJson;
  }

  getWorkflowService(): WorkflowsService {
    return this._w;
  }
}
