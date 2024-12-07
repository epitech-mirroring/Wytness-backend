import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';
import * as path from 'path';

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
  console.log(`Swagger JSON written to ${jsonPath}`);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });

  if (isOpenApiEnable(process.argv)) {
    console.log('OpenAPI enabled');
    const config = new DocumentBuilder()
      .setTitle('Wytness API')
      .setDescription('The Wytness API description')
      .setVersion('1.0')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);

    await writeSwaggerJson(document);
  }

  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true}));
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
