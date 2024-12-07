import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UserDto {
    @ApiProperty({
        description: 'The email of the User',
        example: 'usermail@site.com'
    })
    @IsEmail()
    email: string;

    @ApiProperty({
        description: 'The name of the User',
        example: 'John'
    })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({
        description: 'The surname of the User',
        example: 'Doe'
    })
    @IsString()
    @IsNotEmpty()
    surname: string;
}
