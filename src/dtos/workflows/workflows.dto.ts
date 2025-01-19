import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

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

  @ApiProperty({
    description: 'The position of the Node',
    example: {
      x: 100,
      y: 100,
    },
  })
  @IsOptional()
  @IsObject()
  position?: {
    x: number;
    y: number;
  };
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

  @ApiProperty({
    description: 'The position of the Node',
    example: {
      x: 100,
      y: 100,
    },
  })
  @IsOptional()
  @IsObject()
  position?: {
    x: number;
    y: number;
  };
}

export class WorkflowUpdateDTO {
  @ApiProperty({
    description: 'The name of the Workflow',
    example: 'My Workflow',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'The description of the Workflow',
    example: 'This is a description of the Workflow',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'The status of the Workflow',
    example: 'enabled',
  })
  @IsOptional()
  @IsString()
  status?: string;
}
