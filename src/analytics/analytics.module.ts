import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Analytics } from '../models/analytics.model';
import { Url } from '../models/url.model';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';

@Module({
  imports: [SequelizeModule.forFeature([Analytics, Url])],
  providers: [AnalyticsService],
  controllers: [AnalyticsController],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
