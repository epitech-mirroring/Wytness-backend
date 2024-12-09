import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { FirebaseService } from 'src/providers/firebase/firebase.service';
import { HttpService } from '@nestjs/axios';
import { AxiosError } from 'axios';
import { firstValueFrom, catchError } from 'rxjs';
import { ServiceType } from '@prisma/client';

@Injectable()
export class SpotifyService {
    constructor(
        private readonly configService: ConfigService,
        private readonly usersService: UsersService,
        private readonly httpService: HttpService,
        private readonly firebaseService: FirebaseService,
    ) {}

    private client_id = this.configService.get('SPOTIFY_CLIENT_ID');
    private client_secret = this.configService.get('SPOTIFY_CLIENT_SECRET');
    private redirect_uri = this.configService.get('SPOTIFY_REDIRECT_URI');

    private scope: string;
    private auth_url = 'https://accounts.spotify.com/authorize';
    private token_url = 'https://accounts.spotify.com/api/token';
    private api_base_url = 'https://api.spotify.com/v1/';

    login(user_token: string, link: string) : string {
        const scope = 'user-read-private user-read-email';

        const state_json = {
            user_token: user_token,
            link: link,
        }
        const state = Buffer.from(JSON.stringify(state_json)).toString('base64');
        const params = new URLSearchParams({
            response_type: 'code',
            client_id: this.client_id,
            scope: scope,
            redirect_uri: this.redirect_uri,
            state: state,
            show_dialog: 'true',
        });

        const url = `${this.auth_url}?${params.toString()}`;

        return url;
    }

    async callback(code: string, token: string) : Promise<boolean> {
        const req_body = {
            'code': code,
            'grant_type': 'authorization_code',
            'redirect_uri': this.redirect_uri,
        }
        const req_headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${Buffer.from(`${this.client_id}:${this.client_secret}`).toString('base64')}`,
        }
        const user = await this.firebaseService.verifyToken(token);
        if (!user || !user.email) {
            return false;
        }
        const user_email = user.email;
        var expires_at = new Date();

        const { data } = await firstValueFrom(this.httpService.post(this.token_url, req_body, { headers: req_headers }).pipe(
            catchError((error: AxiosError) => {
              console.log(error.toJSON());
              throw 'An error happened while processing the request to Spotify';
            }),
            )
        );
        expires_at.setSeconds(expires_at.getSeconds() + data.expires_in);
        this.usersService.addUserCredentials(user_email, ServiceType.SPOTIFY, data.access_token, data.refresh_token, expires_at);
        return true;
    }

    async unsubscribe(user_email: string) {
        const credentials = await this.usersService.getUserCredentialByServiceType(user_email, ServiceType.SPOTIFY);
        if (credentials !== null) {
            this.usersService.deleteUserCredentialById(credentials.id);
            return true;
        }
        return false;
    }
}
