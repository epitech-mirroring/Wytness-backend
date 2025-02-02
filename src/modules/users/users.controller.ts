import { Controller, Get, Inject } from '@nestjs/common';
import { Private } from '../auth/decorators/private.decorator';
import { AuthContext } from '../auth/auth.context';
import { UsersService } from './users.service';
import {
  ApiBearerAuth,
  ApiResponse,
  ApiUnauthorizedResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { FullUser } from '../../types/user';

@Controller('users')
export class UsersController {
  @Inject(AuthContext)
  private _authContext: AuthContext;

  @Inject()
  private readonly _usersService: UsersService;

  @Private()
  @Get('/me')
  @ApiBearerAuth('token')
  @ApiResponse({
    status: 200,
    description: 'Get user data',
    schema: {
      $ref: getSchemaPath(FullUser),
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
  })
  async getMe() {
    return this._usersService.getUserById(
      this._authContext.user.id,
      this._authContext.user,
    );
  }
}
