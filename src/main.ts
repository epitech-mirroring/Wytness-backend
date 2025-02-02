import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';
import * as path from 'path';
import 'reflect-metadata';
import { FullUser } from './types/user';
import { NodeDTO } from './dtos/node/node.dto';
import { ListService } from './types/services';

const isOpenApiEnable = (argv: string[]): boolean => {
  for (const arg of argv) {
    if (arg.startsWith('openapi=')) {
      return arg[arg.length - 1] === '1';
    }
  }
  return false;
};

const writeSwaggerJson = async (document: any) => {
  const jsonPath = path.join(__dirname, 'swagger.json');
  fs.writeFileSync(jsonPath, JSON.stringify(document, null, 2));
  console.info(`Swagger JSON written to ${jsonPath}`);
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });

  if (isOpenApiEnable(process.argv)) {
    console.info('OpenAPI enabled');
    const config = new DocumentBuilder()
      .setTitle('Wytness API')
      .setDescription('The Wytness API description')
      .setVersion('1.0')
      .addServer('http://localhost:4040', 'Localhost server')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config, {
      extraModels: [FullUser, NodeDTO, ListService],
    });
    SwaggerModule.setup('api', app, document);

    await writeSwaggerJson(document);
    return;
  }

  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap().then();
