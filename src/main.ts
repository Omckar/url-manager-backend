import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Use Helmet for securing HTTP headers
  app.use(helmet());

  // Enable CORS with configurations from configService
  const configService = app.get(ConfigService);
  const frontendUrl = configService.get<string>('FRONTEND_URL', 'http://localhost:4200');
  app.enableCors({
    origin: frontendUrl,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Global Validation Pipe for payload validation & sanitization
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,            // Strips any properties not in the DTO
      forbidNonWhitelisted: true, // Throws an error if extra properties are sent
      transform: true,            // Automatically transforms payloads to match DTO types
    }),
  );

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}/api`);
}
bootstrap();
