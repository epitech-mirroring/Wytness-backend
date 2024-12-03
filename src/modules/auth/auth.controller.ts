import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto, RegisterDto } from '../../dtos/auth/auth.dto';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('login')
    async login(@Body() body: AuthDto): Promise<{token: string}> {
        const token: {token: string} | {error: string} = await this.authService.login(body.email, body.password);
        if ('token' in token) {
            return { token: token.token };
        }
        throw new UnauthorizedException(token.error);
    }

    @Post('register')
    async register(@Body() body: RegisterDto): Promise<{token: string}> {
        const token: {token: string} | {error: string} = await this.authService.register(body.email, body.password, body.name, body.surname);
        if ('token' in token) {
            return { token: token.token };
        }
        throw new UnauthorizedException(token.error);
    }
}

