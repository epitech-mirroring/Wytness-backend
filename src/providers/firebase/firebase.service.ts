import { Inject, Injectable } from '@nestjs/common';
import { app } from 'firebase-admin';
import { getAuth } from '@firebase/auth';

@Injectable()
export class FirebaseService {
  constructor(@Inject('FIREBASE_APP') private readonly firebaseApp: app.App) {}

  private auth = getAuth();

  getApp(): app.App {
    return this.firebaseApp;
  }

  getAuth() {
    return this.auth;
  }
}
