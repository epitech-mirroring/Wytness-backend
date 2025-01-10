import { Inject, Injectable } from '@nestjs/common';
import { FirebaseService } from '../../providers/firebase/firebase.service';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from '@firebase/auth';
import { Request } from 'express';
import { AuthContext } from './auth.context';
import { TokenPayload } from '../../types/auth';
import { Repository } from 'typeorm';
import { User } from '../../types/user';
import { PermissionsService } from '../permissions/permissions.service';

@Injectable()
export class AuthService {
  @Inject()
  private _authContext: AuthContext;

  @Inject('USER_REPOSITORY')
  private _userRepository: Repository<User>;

  @Inject()
  private _permissionsService: PermissionsService;

  constructor(private firebaseService: FirebaseService) {}

  async validateToken(token: string): Promise<boolean> {
    const decodedToken = await this.firebaseService
      .getApp()
      .auth()
      .verifyIdToken(token)
      .then((decodedToken) => {
        return decodedToken;
      })
      .catch((error) => {
        console.error(error);
        return null;
      });
    return !!decodedToken;
  }

  async getTokenPayload(token: string): Promise<TokenPayload | null> {
    return await this.firebaseService
      .getApp()
      .auth()
      .verifyIdToken(token)
      .then((decodedToken) => {
        return decodedToken;
      })
      .catch((error) => {
        console.error(error);
        return null;
      });
  }

  async login(
    email: string,
    password: string,
  ): Promise<{ token: string } | { error: string }> {
    const user = await signInWithEmailAndPassword(
      this.firebaseService.getAuth(),
      email,
      password,
    )
      .then((userCredential) => {
        return userCredential.user;
      })
      .catch((error) => {
        return error.message;
      });
    let result: { token: string } | { error: string };
    if (typeof user === 'object') {
      result = {
        token: await this.firebaseService.getAuth().currentUser.getIdToken(),
      };
    } else {
      result = { error: user };
    }
    await this.firebaseService.getAuth().signOut();
    return result;
  }

  async register(
    email: string,
    password: string,
    name: string,
    surname: string,
  ): Promise<{ token: string } | { error: string }> {
    const user = await createUserWithEmailAndPassword(
      this.firebaseService.getAuth(),
      email,
      password,
    )
      .then((userCredential) => {
        return userCredential.user;
      })
      .catch((error) => {
        return error.message;
      });
    if (typeof user === 'string') {
      return { error: user };
    }
    const userExists = !!(await this._userRepository.findOne({
      where: { email },
    }));
    if (userExists) {
      return {
        error: 'PostgreSQL: Error (user already exists with that email)',
      };
    }
    const id = (
      await this._userRepository.insert({
        firebaseId: user.uid,
        email,
        name,
        surname,
      })
    ).identifiers[0].id;
    await this._permissionsService.addPolicyToUser(id, 'User');
    const token = await this.firebaseService.getAuth().currentUser.getIdToken();
    await this.firebaseService.getAuth().signOut();
    return { token };
  }

  public extractTokenFromRequest(request: Request): string | null {
    const header = request.headers.authorization;

    if (!header) {
      return null;
    }

    const [type, token] = header.split(' ');

    if (type !== 'Bearer') {
      return null;
    }

    return token;
  }

  public async setAuthContextFromTokenPayloadAsync(
    payload: TokenPayload,
  ): Promise<boolean> {
    const user = await this._userRepository.findOne({
      where: { firebaseId: payload.uid },
    });
    if (!user) {
      return false;
    }

    this._authContext.user = user;
    return true;
  }

  public resetAuthContext() {
    this._authContext.user = undefined;
  }
}
