import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Action, Field, FieldType } from '../../../../types/services';
import { WorkflowExecutionTrace } from '../../../../types/workflow';
import { WorkflowsService } from '../../../../modules/workflows/workflows.service';
import { ExecutionsService } from '../../../../modules/workflows/executions.service';

@Injectable()
export class GetSchedule extends Action {
  @Inject()
  private readonly _configService: ConfigService;

  @Inject(forwardRef(() => WorkflowsService))
  public _w: WorkflowsService;

  @Inject(forwardRef(() => ExecutionsService))
  public _executions: ExecutionsService;

  constructor() {
    super(
      'Get schedule for a stop',
      'Get the schedule for a stop using the stop code',
      ['output'],
      [
        new Field(
          'stopCode',
          'stopcode',
          'Stop code of the stop',
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
    const stopcode = trace.processPipelineString(trace.config.stopcode);

    if (!stopcode) {
      this.error(trace, 'stopCode is required');
      return;
    }

    const url = `https://open.tan.fr/ewp/tempsattente.json/${stopcode}`;

    const res = await this.fetch(trace, url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      this.error(trace, 'Failed to fetch tan info from the stop code');
      return;
    }

    const resJson = await res.json();
    const schedule = resJson.map((item: any) => ({
      line: item.ligne.numLigne,
      terminal: item.terminus,
      time: item.temps,
      stop: item.arret.codeArret,
    }));
    return {
      schedules: schedule,
    };
  }

  getWorkflowService(): WorkflowsService {
    return this._w;
  }

  getExecutionService(): ExecutionsService {
    return this._executions;
  }
}
