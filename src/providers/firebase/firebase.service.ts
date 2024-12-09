import { Inject, Injectable } from '@nestjs/common';
import { app } from 'firebase-admin';
import { getAuth } from '@firebase/auth';
import { DecodedIdToken } from 'firebase-admin/auth';


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

    async verifyToken(token: string) : Promise<DecodedIdToken | null> {
        try {
            const decodedToken = await this.firebaseApp.auth().verifyIdToken(token);
            return decodedToken;
        } catch (error) {
            console.error('Error while verifying token:', error);
            return null;
        }
    }
}
