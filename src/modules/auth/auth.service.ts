import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { FirebaseService } from '../../providers/firebase/firebase.service';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from '@firebase/auth'


@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private firebaseService: FirebaseService,
    ) {}

    async validateToken(token: string): Promise<Boolean> {
        const decodedToken = await this.firebaseService.getApp().auth().verifyIdToken(token).then((decodedToken) => {
            return decodedToken;
        }).catch((error) => {
            return null;
        });
        if (decodedToken) {
            return true;
        }
        return false;
    }

    async login(email: string, password: string): Promise<{token: string} | {error: string}> {
        const user = await signInWithEmailAndPassword(this.firebaseService.getAuth(), email, password).then((userCredential) => {
            return userCredential.user;
        }).catch((error) => {
            return error.message;
        });
        if (typeof user === 'object') {
            return {token: user.accessToken};
        }
        return {error: user};
    }

    async register(email: string, password: string, name: string, surname: string): Promise<{token: string} | {error: string}> {
        const user = await createUserWithEmailAndPassword(this.firebaseService.getAuth(), email, password).then((userCredential) => {
            return userCredential.user;
        }).catch((error) => {
            return error.message;
        });
        if (typeof user === 'string') {
            return {error: user};
        }
        const userExists = await this.usersService.getUserByEmail(email);
        if (userExists) {
            return {error: 'PostgreSQL: Error (user already exists with that email)'};
        }
        await this.usersService.createUser(email, name, surname);
        return {token: user.accessToken};
    }
}
