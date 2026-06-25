import { Controller, Get, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';

@Controller('api/analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  async getDashboardStats(@CurrentUser() user: any) {
    const stats = await this.analyticsService.getDashboardStats(user.userId);
    const charts = await this.analyticsService.getAnalyticsDetails(user.userId);
    return { stats, charts };
  }

  @Get('recent')
  async getRecentActivity(@CurrentUser() user: any) {
    return this.analyticsService.getRecentActivity(user.userId);
  }

  @Get('top')
  async getTopLinks(@CurrentUser() user: any) {
    return this.analyticsService.getTopLinks(user.userId);
  }

  @Get('url/:urlId')
  async getUrlAnalytics(
    @CurrentUser() user: any,
    @Param('urlId', ParseIntPipe) urlId: number,
  ) {
    return this.analyticsService.getAnalyticsDetails(user.userId, urlId);
  }
}
