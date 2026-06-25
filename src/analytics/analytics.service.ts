import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Analytics } from '../models/analytics.model';
import { Url } from '../models/url.model';
import { parseUserAgent } from '../utils/user-agent';
import { Op, fn, col } from 'sequelize';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(Analytics)
    private analyticsModel: typeof Analytics,
    @InjectModel(Url)
    private urlModel: typeof Url,
  ) {}

  async recordClick(urlId: number, ip: string, userAgent: string, referrer: string): Promise<void> {
    const { browser, device, operatingSystem } = parseUserAgent(userAgent);

    // Save click log in database
    await this.analyticsModel.create({
      urlId,
      ipAddress: ip || '127.0.0.1',
      browser,
      device,
      operatingSystem,
      country: 'Local', // Defaults to 'Local' for local server testing
      referrer: referrer || 'Direct',
      timestamp: new Date(),
    } as any);

    // Increment clickCount in the URL model
    const url = await this.urlModel.findByPk(urlId);
    if (url) {
      url.clickCount += 1;
      await url.save();
    }
  }

  // Fetch dashboard high-level counter summaries
  async getDashboardStats(userId: number) {
    const now = new Date();

    // 1. Fetch URLs counts
    const urls = await this.urlModel.findAll({ where: { userId } });
    const totalUrls = urls.length;
    
    const activeUrls = urls.filter(
      (u) => u.isActive && (!u.expiryDate || new Date(u.expiryDate) > now),
    ).length;

    const expiredUrls = urls.filter(
      (u) => u.expiryDate && new Date(u.expiryDate) < now,
    ).length;

    // 2. Fetch total clicks
    const totalClicks = urls.reduce((sum, u) => sum + u.clickCount, 0);

    // 3. Fetch today's, weekly, and monthly clicks for user URLs
    const urlIds = urls.map((u) => u.id);
    if (urlIds.length === 0) {
      return {
        totalUrls: 0,
        activeUrls: 0,
        expiredUrls: 0,
        totalClicks: 0,
        todayClicks: 0,
        weeklyClicks: 0,
        monthlyClicks: 0,
      };
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - 7);

    const startOfMonth = new Date();
    startOfMonth.setDate(startOfMonth.getDate() - 30);

    const [todayClicks, weeklyClicks, monthlyClicks] = await Promise.all([
      this.analyticsModel.count({
        where: { urlId: { [Op.in]: urlIds }, timestamp: { [Op.gte]: startOfToday } },
      }),
      this.analyticsModel.count({
        where: { urlId: { [Op.in]: urlIds }, timestamp: { [Op.gte]: startOfWeek } },
      }),
      this.analyticsModel.count({
        where: { urlId: { [Op.in]: urlIds }, timestamp: { [Op.gte]: startOfMonth } },
      }),
    ]);

    return {
      totalUrls,
      activeUrls,
      expiredUrls,
      totalClicks,
      todayClicks,
      weeklyClicks,
      monthlyClicks,
    };
  }

  // Get recent URL clicks activity
  async getRecentActivity(userId: number, limit = 10) {
    const urls = await this.urlModel.findAll({ where: { userId }, attributes: ['id', 'shortCode', 'longUrl'] });
    const urlIds = urls.map((u) => u.id);
    if (urlIds.length === 0) return [];

    return this.analyticsModel.findAll({
      where: { urlId: { [Op.in]: urlIds } },
      include: [
        {
          model: Url,
          attributes: ['shortCode', 'customAlias', 'longUrl'],
        },
      ],
      order: [['timestamp', 'DESC']],
      limit,
    });
  }

  // Get Top links based on click counts
  async getTopLinks(userId: number, limit = 5) {
    return this.urlModel.findAll({
      where: { userId },
      order: [['clickCount', 'DESC']],
      limit,
    });
  }

  // Detailed analytics charts aggregation for a single URL or all user URLs
  async getAnalyticsDetails(userId: number, urlId?: number) {
    let urlIds: number[] = [];
    if (urlId) {
      // Single URL analytics
      const url = await this.urlModel.findByPk(urlId);
      if (!url) throw new NotFoundException('URL not found');
      if (url.userId !== userId) throw new ForbiddenException('Forbidden access');
      urlIds = [url.id];
    } else {
      // General dashboard aggregation for all user URLs
      const urls = await this.urlModel.findAll({ where: { userId }, attributes: ['id'] });
      urlIds = urls.map((u) => u.id);
    }

    if (urlIds.length === 0) {
      return {
        clicksOverTime: [],
        deviceDistribution: [],
        browserDistribution: [],
        countryDistribution: [],
      };
    }

    const whereClause = { urlId: { [Op.in]: urlIds } };

    // Clicks over time (grouped by date) - query last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const clicksOverTime = await this.analyticsModel.findAll({
      where: { ...whereClause, timestamp: { [Op.gte]: thirtyDaysAgo } },
      attributes: [
        [fn('DATE', col('timestamp')), 'date'],
        [fn('COUNT', col('id')), 'count'],
      ],
      group: [fn('DATE', col('timestamp'))],
      order: [[fn('DATE', col('timestamp')), 'ASC']],
      raw: true,
    });

    // Devices distribution
    const deviceDistribution = await this.analyticsModel.findAll({
      where: whereClause,
      attributes: [
        ['device', 'name'],
        [fn('COUNT', col('id')), 'value'],
      ],
      group: ['device'],
      raw: true,
    });

    // Browser distribution
    const browserDistribution = await this.analyticsModel.findAll({
      where: whereClause,
      attributes: [
        ['browser', 'name'],
        [fn('COUNT', col('id')), 'value'],
      ],
      group: ['browser'],
      raw: true,
    });

    // Country distribution
    const countryDistribution = await this.analyticsModel.findAll({
      where: whereClause,
      attributes: [
        ['country', 'name'],
        [fn('COUNT', col('id')), 'value'],
      ],
      group: ['country'],
      raw: true,
    });

    return {
      clicksOverTime,
      deviceDistribution,
      browserDistribution,
      countryDistribution,
    };
  }
}
