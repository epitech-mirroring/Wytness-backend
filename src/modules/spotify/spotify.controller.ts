import { Controller, Get, Redirect, UnauthorizedException, Req, Body, Param } from '@nestjs/common';
import { Request } from 'express';
import { SpotifyService } from './spotify.service';
import { UsersService } from '../users/users.service';

@Controller('spotify')
export class SpotifyController {
    constructor(private readonly spotifyService: SpotifyService,
                private readonly usersService: UsersService) {}

    @Get('login')
    @Redirect('http:://localhost:3000', 301)
    async login(@Req() request: Request) {
        const email = request['user_email'];
        const link = request.query.link as string;
        if (!email) {
            return new UnauthorizedException('No email found');
        }
        if (!link) {
            return new UnauthorizedException('No link found');
        }
        if (await this.usersService.getUserCredentialByServiceType(email, 'SPOTIFY')) {
            return new UnauthorizedException('User already has Spotify credentials');
        }
        if (!('authorization' in request.headers)) {
            return new UnauthorizedException('No authorization header found');
        }
        const user_token = request.headers.authorization.split(' ')[1];
        if (!user_token) {
            return new UnauthorizedException('No user token found');
        }
        const url = this.spotifyService.login(user_token, link);
        return { url: url };
    }

    @Get('callback')
    @Redirect('http:://localhost:3000', 301)
    async callback(@Req() request: Request) {
        if ('error' in request.query) {
            return new UnauthorizedException(request.query.error);
        }
        if (!('code' in request.query)) {
            return new UnauthorizedException('No code in query');
        }
        if (!('state' in request.query)) {
            return new UnauthorizedException('Missing state in query');
        }
        const state_json = JSON.parse(Buffer.from(request.query.state as string, 'base64').toString());
        const state = state_json['user_token'];
        const link = state_json['link'];
        const code = request.query.code as string;
        const success = await this.spotifyService.callback(code, state);
        if (success) {
            return { url: link };
        }
        return new UnauthorizedException('Error while processing callback of Spotify');
    }

    @Get('disconnect')
    async disconnect(@Req() request: Request) {
        const email = request['user_email'];
        if (!email) {
            return new UnauthorizedException('No email found');
        }
        if (!(await this.spotifyService.unsubscribe(email))) {
            return new UnauthorizedException('You are not subscribed to Spotify');
        }
        return 'Success';
    }
}
