import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
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
    description: 'Is this Node an entrypoint',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  entrypoint?: boolean;
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
}
