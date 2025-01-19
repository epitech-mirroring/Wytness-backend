import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WorkflowsModule } from '../../modules/workflows/workflows.module';
import { AuthModule } from '../../modules/auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Node, Service, ServiceUser } from '../../types/services';
import { User } from '../../types/user';
import { OpenAIService } from './openia.service';
import { OpenAIAction } from './nodes/actions/make.prompt';

@Module({
  imports: [
    AuthModule,
    ConfigModule,
    forwardRef(() => WorkflowsModule),
    TypeOrmModule.forFeature([Service, User, Node, ServiceUser]),
  ],
  providers: [OpenAIService, OpenAIAction],
  exports: [OpenAIService, OpenAIAction],
})
export class OpeniaModule {}
