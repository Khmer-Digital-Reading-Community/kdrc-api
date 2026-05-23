import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
    credentials: true,
  });
  // 1. Configure Swagger
  const config = new DocumentBuilder()
    .setTitle('KDRC API')
    .setDescription('The KDRC Bookmarks API documentation')
    .setVersion('1.0')
    .addBearerAuth() // Enables JWT authentication in Swagger UI
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document); // Maps the UI to /api

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Automatically removes non-allowed fields
      transform: true, // Automatically transforms payloads to DTO instances
      forbidNonWhitelisted: true, // Optional: Errors out if extra fields are sent
    }),
  );
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
