import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

app.setGlobalPrefix('api');

// Use Helmet
app.use(helmet());

  // Enable CORS with configurations from configService
  const configService = app.get(ConfigService);

const allowedOrigins = (
  configService.get<string>('FRONTEND_URL') ??
  'http://localhost:4200'
)
  .split(',')
  .map(origin => origin.trim());

app.enableCors({
  origin: (origin, callback) => {
    // Allow Postman, curl, etc.
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`Origin ${origin} not allowed by CORS`), false);
  },
  credentials: true,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  allowedHeaders: ['Content-Type', 'Authorization'],
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
