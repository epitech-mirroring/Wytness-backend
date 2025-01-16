import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { User } from '../../types/user';
import { RequestScope } from 'nj-request-scope';

@Injectable()
@RequestScope()
export class AuthContext {
  private _user: User | undefined = undefined;

  public set user(user: User | undefined) {
    this._user = user;
  }

  public get user(): User {
    if (!this._user) {
      throw new InternalServerErrorException('User not authenticated');
    }
    return this._user;
  }

  get authenticated(): boolean {
    return !!this._user;
  }
}
