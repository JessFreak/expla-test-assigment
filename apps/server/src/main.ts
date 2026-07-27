import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import config from './config/config';
import { API_GLOBAL_PREFIX } from './utils/constants';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get<ConfigType<typeof config>>(config.KEY);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  app.enableCors({
    origin: configService.clientUrl,
    credentials: true,
  });

  app.setGlobalPrefix(API_GLOBAL_PREFIX);

  const port = configService.serverPort;
  await app.listen(port);

  console.log(`Server started on http://localhost:${port}/${API_GLOBAL_PREFIX}`);
}

bootstrap();