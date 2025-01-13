import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto, RegisterDto } from '../../dtos/auth/auth.dto';
import { ApiResponse, ApiTags, ApiBody } from '@nestjs/swagger';
import { Public } from './decorators/public.decorator';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @ApiBody({
    description: 'Email and password of the user (login)',
    type: AuthDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    schema: {
      properties: {
        token: { type: 'string' },
      },
      example: { token: 'string' },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    schema: {
      properties: {
        statusCode: { type: 'number' },
        error: { type: 'string' },
      },
      example: { statusCode: 401, error: 'string' },
    },
  })
  async login(@Body() body: AuthDto): Promise<{ token: string }> {
    const token: { token: string; debug?: string } | { error: string } =
      await this.authService.login(body.email, body.password);
    if ('token' in token) {
      return token;
    }
    throw new UnauthorizedException(token.error);
  }

  @Public()
  @Post('register')
  @ApiBody({
    description: 'Email, password, name and surname of the user (registration)',
    type: RegisterDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Registration successful',
    schema: { example: { token: 'string' } },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    schema: { example: { statusCode: 401, error: 'string' } },
  })
  async register(@Body() body: RegisterDto): Promise<{ token: string }> {
    const token: { token: string; debug?: string } | { error: string } =
      await this.authService.register(
        body.email,
        body.password,
        body.name,
        body.surname,
      );
    if ('token' in token) {
      return token;
    }
    throw new UnauthorizedException(token.error);
  }
}
