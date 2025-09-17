import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { UsersModule } from './users.module';
import * as fs from 'fs';
import * as dotenv from 'dotenv';
dotenv.config();

async function bootstrap() {
  dotenv.config();

  //eslint-disable-next-line
  const httpsOptions =
    process.env.PROD === 'true'
      ? {
        key: fs.readFileSync('/root/ssl/key.pem'),
        cert: fs.readFileSync('/root/ssl/cert.pem'),
      }
      : {};

  const port = 3002;

  const app = await NestFactory.create(UsersModule, {});

  app.useGlobalPipes(new ValidationPipe());
  app.enableCors();
  console.log('USERS API RUNNING ON PORT: ' + port);
  await app.listen(port);
}
bootstrap();
