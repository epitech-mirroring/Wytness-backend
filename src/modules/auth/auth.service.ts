import { Inject, Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { FirebaseService } from '../../providers/firebase/firebase.service';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from '@firebase/auth';
import { TokenPayload } from '../../types';
import { Request } from 'express';
import { AuthContext } from './auth.context';

@Injectable()
export class AuthService {
  @Inject()
  private _authContext: AuthContext;

  constructor(
    private usersService: UsersService,
    private firebaseService: FirebaseService,
  ) {}

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
    if (typeof user === 'object') {
      return {
        token: await this.firebaseService
          .getApp()
          .auth()
          .createCustomToken(user.uid),
      };
    }
    return { error: user };
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
    const userExists = await this.usersService.getUserByEmail(email);
    if (userExists) {
      return {
        error: 'PostgreSQL: Error (user already exists with that email)',
      };
    }
    await this.usersService.createUser(user.uid, email, name, surname);
    return {
      token: await this.firebaseService
        .getApp()
        .auth()
        .createCustomToken(user.uid),
    };
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
    const user = await this.usersService.getUserByFirebaseId(payload.sub);
    if (!user) {
      return false;
    }

    this._authContext.user = user;
    return true;
  }
}
