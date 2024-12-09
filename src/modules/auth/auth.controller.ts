import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto, RegisterDto } from '../../dtos/auth/auth.dto';
import { ApiResponse, ApiTags, ApiBody, ApiProperty } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('login')
    @ApiBody({
        description: 'Email and password of the user (login)',
        type: AuthDto
    })
    @ApiResponse({ status: 200, description: 'Login successful', schema: { example: { token: 'string' } } })
    @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: { statusCode: 401, error: 'string' } } })
    async login(@Body() body: AuthDto): Promise<{token: string}> {
        const token: {token: string} | {error: string} = await this.authService.login(body.email, body.password);
        if ('token' in token) {
            return { token: token.token };
        }
        throw new UnauthorizedException(token.error);
    }

    @Post('register')
    @ApiBody({
        description: 'Email, password, name and surname of the user (registration)',
        type: RegisterDto
    })
    @ApiResponse({ status: 200, description: 'Registration successful', schema: { example: { token: 'string' } } })
    @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: { statusCode: 401, error: 'string' } } })
    async register(@Body() body: RegisterDto): Promise<{token: string}> {
        const token: {token: string} | {error: string} = await this.authService.register(body.email, body.password, body.name, body.surname);
        if ('token' in token) {
            return { token: token.token };
        }
        throw new UnauthorizedException(token.error);
    }
}

