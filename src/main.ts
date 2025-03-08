import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { envs } from './config/envs';

async function bootstrap() {
  const logger = new Logger('Payment-ms');

  const app = await NestFactory.create(AppModule);
  await app.listen(envs.PORT);

  logger.log(`Payment-ms is running on port ${envs.PORT}`);
}
bootstrap();
