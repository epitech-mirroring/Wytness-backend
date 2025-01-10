import { Controller, Get, Inject } from '@nestjs/common';
import { Private } from '../auth/decorators/private.decorator';
import { AuthContext } from '../auth/auth.context';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  @Inject(AuthContext)
  private _authContext: AuthContext;

  @Inject()
  private readonly _usersService: UsersService;

  @Private()
  @Get('/me')
  async getMe() {
    return this._usersService.getUserById(
      this._authContext.user.id,
      this._authContext.user,
    );
  }
}
