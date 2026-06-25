import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { SequelizeModule } from '@nestjs/sequelize';
import { AppController } from './app.controller';
import { User } from './models/user.model';
import { Url } from './models/url.model';
import { Analytics } from './models/analytics.model';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { UrlsModule } from './urls/urls.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          ttl: configService.get<number>('THROTTLE_TTL', 60000), // 1 minute in ms
          limit: configService.get<number>('THROTTLE_LIMIT', 100), // max 100 requests per ttl
        },
      ],
    }),
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        dialect: 'mysql',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 3306),
        username: configService.get<string>('DB_USER', 'root'),
        password: configService.get<string>('DB_PASS', 'password'),
        database: configService.get<string>('DB_NAME', 'url_manager'),
        models: [User, Url, Analytics],
        autoLoadModels: true,
        synchronize: true, // Auto-create tables in database on startup
        logging: false,
      }),
    }),
    UsersModule,
    AuthModule,
    UrlsModule,
    AnalyticsModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
