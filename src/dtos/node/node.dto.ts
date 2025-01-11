import { Field } from 'src/types/services/field.type';
import { ApiProperty, ApiSchema } from '@nestjs/swagger';

@ApiSchema({ name: 'NodeDTO' })
export class NodeDTO {
  @ApiProperty({
    description: 'The id of the Node',
    example: 1,
  })
  id: number;
  @ApiProperty({
    description: 'The name of the Node',
    example: 'Node',
  })
  name: string;
  @ApiProperty({
    description: 'The description of the Node',
    example: 'Node description',
  })
  description: string;
  @ApiProperty({
    description: 'The type of the Node',
    enum: ['trigger', 'action'],
  })
  type: string;
  @ApiProperty({
    description: 'The fields of the Node',
    example: [
      {
        name: 'Field',
        key: 'field',
        description: 'Field description',
        type: 'string',
        required: false,
      },
    ],
  })
  fields?: Field[];

  @ApiProperty({
    description: 'The names of the outputs of the Node',
    example: ['output'],
  })
  labels: string[];
}
