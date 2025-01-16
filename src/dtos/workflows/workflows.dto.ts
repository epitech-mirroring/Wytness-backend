import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class WorkflowCreateNodeDTO {
  @ApiProperty({
    description: 'The id of the Node',
    example: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  id: number;

  @ApiProperty({
    description: 'The config of the Node',
    example: {
      config: 'config',
    },
  })
  @IsNotEmpty()
  config: any;

  @ApiProperty({
    description: 'The previous Node to connect to',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  previous?: number;

  @ApiProperty({
    description: 'The label of the output to connect to',
    example: 1,
  })
  @IsOptional()
  @IsString()
  label?: string;
}

export class WorkflowCreateDTO {
  @ApiProperty({
    description: 'The name of the Workflow',
    example: 'My Workflow',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'The description of the Workflow',
    example: 'This is a description of the Workflow',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'The status of the Workflow',
    example: 'enabled',
  })
  @IsString()
  @IsOptional()
  status?: string;
}

export class WorkflowUpdateNodeDTO {
  @ApiProperty({
    description: 'The config of the Node',
    example: {
      config: 'config',
    },
  })
  @IsOptional()
  config?: any;

  @ApiProperty({
    description: 'The previous Node to connect to',
    example: 1,
  })
  @IsOptional()
  previous?: number | null;

  @ApiProperty({
    description: 'The label of the output to connect to',
    example: 1,
  })
  @IsOptional()
  @IsString()
  label?: string;
}
