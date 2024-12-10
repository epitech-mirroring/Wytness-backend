import { Module } from '@nestjs/common';
import { SpotifyService } from './spotify.service';
import { SpotifyController } from './spotify.controller';
import { ConfigModule } from '@nestjs/config';
import { FirebaseModule } from 'src/providers/firebase/firebase.module';
import { UsersModule } from '../users/users.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [ConfigModule, UsersModule, HttpModule, FirebaseModule],
  providers: [SpotifyService],
  controllers: [SpotifyController],
})
export class SpotifyModule {}
