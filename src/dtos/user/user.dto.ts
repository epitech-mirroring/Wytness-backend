import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class UserDto {
    @IsEmail()
    email: string;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    surname: string;
}
