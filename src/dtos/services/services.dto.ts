import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ServiceConnectDTO {
  @ApiProperty({
    description: 'The code returned by the oauth',
    example: '4567854267',
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    description: 'The state returned by the oauth (mandatory for oauth)',
    example: '4567854267',
  })
  @IsString()
  @IsOptional()
  state?: string;
}
