import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ServiceConnectDTO {
  @ApiProperty({
    description: 'The code returned by the oauth',
    example: '4567854267',
  })
  @IsString()
  @IsNotEmpty()
  code: string;
}
