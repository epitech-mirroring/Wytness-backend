import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Action, Field, FieldType } from '../../../../types/services';
import { WorkflowExecutionTrace } from '../../../../types/workflow';
import { WorkflowsService } from '../../../../modules/workflows/workflows.service';
import { ExecutionsService } from '../../../../modules/workflows/executions.service';

@Injectable()
export class GetStops extends Action {
  @Inject()
  private readonly _configService: ConfigService;

  @Inject(forwardRef(() => WorkflowsService))
  public _w: WorkflowsService;

  @Inject(forwardRef(() => ExecutionsService))
  public _executions: ExecutionsService;

  constructor() {
    super(
      'Get the list of stops for a given lat and long',
      'Get the list of stops for a given lat and long',
      ['output'],
      [
        new Field(
          'latitude',
          'latitude',
          'Latitude of the location',
          FieldType.STRING,
          false,
        ),
        new Field(
          'longitude',
          'longitude',
          'Longitude of the location',
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
    const latitude = trace.processPipelineString(trace.config.latitude);
    const longitude = trace.processPipelineString(trace.config.longitude);
    if (!longitude || !latitude) {
      this.error(trace, 'latitude and longitude are required');
      return;
    }

    const url = `https://open.tan.fr/ewp/arrets.json/${latitude}/${longitude}`;

    const res = await this.fetch(trace, url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      this.error(trace, 'Failed to fetch tan info data');
      return;
    }

    const resJson = await res.json();
    const stops = {};
    resJson.forEach((item: any) => {
      stops[item.codeLieu] = {
        name: item.libelle,
        stopCode: item.codeLieu,
        distance: item.distance,
        line: item.ligne.map((line: any) => line.numLigne),
      };
    });
    return {
      stops: stops,
    };
  }

  getWorkflowService(): WorkflowsService {
    return this._w;
  }

  getExecutionService(): ExecutionsService {
    return this._executions;
  }
}
