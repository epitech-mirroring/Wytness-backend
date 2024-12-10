import { Module } from '@nestjs/common';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';
import { PrismaModule } from '../../providers/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { DiscordModule } from '../../services/discord/discord.module';

@Module({
  imports: [PrismaModule, AuthModule, DiscordModule],
  providers: [ServicesService],
  controllers: [ServicesController],
  exports: [ServicesService],
})
export class ServicesModule {}
