import { forwardRef, Module } from '@nestjs/common';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';
import { PrismaModule } from '../../providers/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { DiscordModule } from '../../services/discord/discord.module';
import { SpotifyModule } from '../../services/spotify/spotify.module';
import {SlackModules} from "../../services/slack/slack.modules";

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    forwardRef(() => DiscordModule),
    forwardRef(() => SpotifyModule),
    forwardRef(() => SlackModules)
  ],
  providers: [ServicesService],
  controllers: [ServicesController],
  exports: [ServicesService],
})
export class ServicesModule {}
