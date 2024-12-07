import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AuthDto {
    @ApiProperty({
        description: 'Email address of the user',
        example: 'usermail@site.com'
    })
    @IsEmail()
    email: string;

    @ApiProperty({
        description: 'Password of the user',
        example: 'password'
    })
    @IsString()
    @IsNotEmpty()
    password: string;
}

export class RegisterDto extends AuthDto {
    @ApiProperty({
        description: 'Name of the user',
        example: 'John'
    })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({
        description: 'Surname of the user',
        example: 'Doe'
    })
    @IsString()
    @IsNotEmpty()
    surname: string;
}
