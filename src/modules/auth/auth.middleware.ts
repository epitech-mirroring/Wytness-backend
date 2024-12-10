
import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { DecodedIdToken } from 'firebase-admin/auth';
import { FirebaseService } from 'src/providers/firebase/firebase.service';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
    constructor(private firebase: FirebaseService) {}

    async use(req: Request, res: Response, next: NextFunction) {
        if (!req.headers.authorization) {
            throw new UnauthorizedException('No token provided');
        }
        const token = req.headers.authorization.split(' ')[1];

        if (!token) {
            throw new UnauthorizedException('No token provided');
        }
        const user : DecodedIdToken | null = await this.firebase.verifyToken(token);

        if (!user || !user.email) {
            throw new UnauthorizedException('Invalid token');
        }
        req['user_email'] = user.email;
        next();
    }
}
