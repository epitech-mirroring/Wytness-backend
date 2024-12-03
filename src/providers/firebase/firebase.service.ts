import { Inject, Injectable } from '@nestjs/common';
import { app } from 'firebase-admin';

@Injectable()
export class FirebaseService {
    constructor(@Inject('FIREBASE_APP') private readonly firebaseApp: app.App) {}

    getApp(): app.App {
        return this.firebaseApp;
    }
}
