import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Action, Field, FieldType } from '../../../../types/services';
import { WorkflowExecutionTrace } from '../../../../types/workflow';
import { WorkflowsService } from '../../../../modules/workflows/workflows.service';
import { ExecutionsService } from '../../../../modules/workflows/executions.service';

@Injectable()
export class GetAddress extends Action {
  @Inject()
  private readonly _configService: ConfigService;

  @Inject(forwardRef(() => WorkflowsService))
  public _w: WorkflowsService;

  @Inject(forwardRef(() => ExecutionsService))
  public _executions: ExecutionsService;

  constructor() {
    super(
      'Get address of a location',
      'Get geocoding information for an address ex: Epitech Nantes',
      ['output'],
      [
        new Field(
          'Location',
          'location',
          'The location to Geocode ex: Epitech Nantes',
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
    const address = trace.processPipelineString(trace.config.location);
    const apiKey = this._configService.get<string>('GEOAPIFY_API_KEY');

    if (!address) {
      this.error(trace, 'Address is required');
      return;
    }

    const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(
      address,
    )}&apiKey=${apiKey}`;

    const res = await this.fetch(trace, url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      this.error(trace, 'Failed to fetch geocoding data');
      return;
    }
    const resJson = await res.json();
    return {
      address: resJson.features[0].properties.formatted,
    };
  }

  getWorkflowService(): WorkflowsService {
    return this._w;
  }

  getExecutionService(): ExecutionsService {
    return this._executions;
  }
}
