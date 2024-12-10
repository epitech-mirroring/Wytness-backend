import { Controller, Get, Req, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { UsersService } from './users.service';
import { ApiResponse, ApiTags, ApiBody, ApiHeader } from '@nestjs/swagger';

@ApiTags('users')
@Controller('users')
export class UsersController {
    constructor(private usersService: UsersService) {}

    @Get('/me')
    @ApiHeader({
        name: 'Authorization',
        description: 'Bearer token',
    })
    @ApiResponse({ status: 200, description: 'Get user information', schema: { example: { email: 'string', name: 'string', surname: 'string' } }})
    @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: { statusCode: 401, error: 'string' } }})
    async getMe(@Req() request: Request) {
        const email = request['user_email'];
        if (!email) {
            throw new UnauthorizedException('No email found');
        }
        const user = await this.usersService.getUserByEmail(email);
        const UserDto = {
            email: user.email,
            name: user.name,
            surname: user.surname,
        };
        return UserDto;
    }
}
