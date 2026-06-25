import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Url } from '../models/url.model';
import { UrlsService } from './urls.service';
import { UrlsController } from './urls.controller';
import { RedirectController } from './redirect.controller';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [
    SequelizeModule.forFeature([Url]),
    AnalyticsModule, // For click tracking in RedirectController
  ],
  providers: [UrlsService],
  controllers: [UrlsController, RedirectController],
  exports: [UrlsService],
})
export class UrlsModule {}
