import { forwardRef, Module } from '@nestjs/common';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';
import { AuthModule } from '../auth/auth.module';
import { DiscordModule } from '../../services/discord/discord.module';
import { SpotifyModule } from '../../services/spotify/spotify.module';

@Module({
  imports: [
    AuthModule,
    forwardRef(() => DiscordModule),
    forwardRef(() => SpotifyModule),
  ],
  providers: [ServicesService],
  controllers: [ServicesController],
  exports: [ServicesService],
})
export class ServicesModule {}
