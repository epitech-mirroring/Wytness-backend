import { Controller, Get, Redirect, UnauthorizedException, Req, Res } from '@nestjs/common';
import { Request } from 'express';
import { SpotifyService } from './spotify.service';
import { UsersService } from '../users/users.service';
import { ApiResponse, ApiTags, ApiBody, ApiHeader, ApiQuery } from '@nestjs/swagger';


@ApiTags('spotify')
@Controller('spotify')
export class SpotifyController {
    constructor(private readonly spotifyService: SpotifyService,
                private readonly usersService: UsersService) {}

    @Get('login')
    @ApiHeader({
        name: 'Authorization',
        description: 'Bearer token'
    })
    @ApiQuery({
        name: 'link',
        description: 'Link to redirect to after login to Spotify',
    })
    @ApiResponse({ status: 200, description: 'Redirect to Spotify auth page', schema: { example: { url: 'string' } }})
    @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: { statusCode: 401, error: 'string' } }})
    async login(@Req() request: Request, @Res() response) {
        const email = request['user_email'];
        const link = request.query.link as string;
        if (!email) {
            throw new UnauthorizedException('No email found');
        }
        if (!link) {
            throw new UnauthorizedException('No link found');
        }
        if (await this.usersService.getUserCredentialByServiceType(email, 'SPOTIFY')) {
            throw new UnauthorizedException('User already has Spotify credentials');
        }
        if (!('authorization' in request.headers)) {
            throw new UnauthorizedException('No authorization header found');
        }
        const user_token = request.headers.authorization.split(' ')[1];
        if (!user_token) {
            throw new UnauthorizedException('No user token found');
        }
        const url = this.spotifyService.login(user_token, link);
        response.status(301).redirect(url);
    }

    @Get('callback')
    @ApiResponse({ status: 200, description: 'Redirect to link', schema: { example: { url: 'string' } }})
    @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: { statusCode: 401, error: 'string' } }})
    async callback(@Req() request: Request, @Res() response) {
        if ('error' in request.query) {
            throw new UnauthorizedException(request.query.error);
        }
        if (!('code' in request.query)) {
            throw new UnauthorizedException('No code in query');
        }
        if (!('state' in request.query)) {
            throw new UnauthorizedException('Missing state in query');
        }
        const state_json = JSON.parse(Buffer.from(request.query.state as string, 'base64').toString());
        const state = state_json['user_token'];
        const link = state_json['link'];
        const code = request.query.code as string;
        const success = await this.spotifyService.callback(code, state);
        if (success) {
            response.status(301).redirect(link);
        }
        throw new UnauthorizedException('Error while processing callback of Spotify');
    }

    @Get('disconnect')
    @ApiHeader({
        name: 'Authorization',
        description: 'Bearer token'
    })
    @ApiResponse({ status: 200, description: 'Success', schema: { example: 'Success' }})
    @ApiResponse({ status: 401, description: 'Unauthorized', schema: { example: { statusCode: 401, error: 'string' } }})
    async disconnect(@Req() request: Request) {
        const email = request['user_email'];
        if (!email) {
            throw new UnauthorizedException('No email found');
        }
        if (!(await this.spotifyService.unsubscribe(email))) {
            throw new UnauthorizedException('You are not subscribed to Spotify');
        }
        return 'Success';
    }
}
