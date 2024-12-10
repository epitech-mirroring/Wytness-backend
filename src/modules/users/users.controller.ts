import { Controller, Get, Inject } from '@nestjs/common';
import { Private } from '../auth/decorators/private.decorator';
import { AuthContext } from '../auth/auth.context';

@Controller('users')
export class UsersController {
  @Inject(AuthContext)
  private _authContext: AuthContext;

  @Private()
  @Get('/me')
  async getMe() {
    return this._authContext.user;
  }
}
