import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Action, Field, FieldType } from '../../../../types/services';
import { WorkflowsService } from '../../../../modules/workflows/workflows.service';
import { WorkflowExecutionTrace } from '../../../../types/workflow';
import { ExecutionsService } from '../../../../modules/workflows/executions.service';

@Injectable()
export class WeatherAction extends Action {
  @Inject()
  private readonly _configService: ConfigService;

  @Inject(forwardRef(() => WorkflowsService))
  public _w: WorkflowsService;

  @Inject(forwardRef(() => ExecutionsService))
  public _executions: ExecutionsService;

  constructor() {
    super(
      'Get current Weather',
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
    return {
      weather: {
        temp: resJson.current.temp_c,
        actual: resJson.current.condition.text,
        wind: resJson.current.wind_kph,
        humidity: resJson.current.humidity,
        uv: resJson.current.uv,
        pressure: resJson.current.pressure_mb,
      },
    };
  }

  getWorkflowService(): WorkflowsService {
    return this._w;
  }

  getExecutionService(): ExecutionsService {
    return this._executions;
  }
}
