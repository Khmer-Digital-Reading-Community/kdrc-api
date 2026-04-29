import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,        // Automatically removes non-allowed fields
    transform: true,        // Automatically transforms payloads to DTO instances
    forbidNonWhitelisted: true, // Optional: Errors out if extra fields are sent
  }));
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
