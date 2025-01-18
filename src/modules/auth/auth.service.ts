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
import * as process from 'node:process';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class AuthService {
  @Inject()
  private _authContext: AuthContext;

  @InjectRepository(User)
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
      .catch(() => {
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
    let result: { token: string; debug?: string } | { error: string };
    if (typeof user === 'object') {
      result = {
        token: await this.firebaseService
          .getApp()
          .auth()
          .createCustomToken(user.uid),
        debug: undefined,
      } as { token: string; debug?: string };
    } else {
      result = { error: user } as { error: string };
    }
    if ('error' in result) {
      return result;
    }
    if (process.env.NODE_ENV === 'development') {
      result.debug = await this.firebaseService
        .getAuth()
        .currentUser.getIdToken();
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
    const token = await this.firebaseService
      .getApp()
      .auth()
      .createCustomToken(user.uid);
    const result = {
      token,
      debug:
        process.env.NODE_ENV === 'development'
          ? await this.firebaseService.getAuth().currentUser.getIdToken()
          : undefined,
    };
    await this.firebaseService.getAuth().signOut();
    return result;
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
