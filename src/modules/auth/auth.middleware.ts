
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { DecodedIdToken } from 'firebase-admin/auth';
import { FirebaseService } from 'src/providers/firebase/firebase.service';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
    constructor(private firebase: FirebaseService) {}

    async use(req: Request, res: Response, next: NextFunction) {
        if (!req.headers.authorization) {
        return res.status(401).json({ message: 'Unauthorized' });
        }
        const token = req.headers.authorization.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const user : DecodedIdToken | null = await this.firebase.verifyToken(token);

        if (!user || !user.email) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        req['user_email'] = user.email;
        next();
    }
}
