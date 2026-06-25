import { Controller, Get, Param, Req, Res, HttpStatus } from '@nestjs/common';
import { UrlsService } from './urls.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';

@Controller()
export class RedirectController {
  constructor(
    private readonly urlsService: UrlsService,
    private readonly analyticsService: AnalyticsService,
    private readonly configService: ConfigService,
  ) {}

  @Get(':shortCode')
  async redirect(
    @Param('shortCode') shortCode: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:4200');

    // 1. Retrieve the URL record by short code or custom alias
    const url = await this.urlsService.findByShortCode(shortCode);
    if (!url) {
      // If it doesn't exist, redirect to the frontend 404 page
      return res.redirect(HttpStatus.FOUND, `${frontendUrl}/404`);
    }

    // 2. Check if the URL is active
    if (!url.isActive) {
      return res.redirect(HttpStatus.FOUND, `${frontendUrl}/404`);
    }

    // 3. Check if the URL has expired
    if (url.expiryDate && new Date(url.expiryDate) < new Date()) {
      return res.redirect(HttpStatus.FOUND, `${frontendUrl}/expired`);
    }

    // 4. Check if the URL is password-protected
    if (url.passwordHash) {
      // Redirect to the frontend password-entry screen
      return res.redirect(HttpStatus.FOUND, `${frontendUrl}/unlock/${shortCode}`);
    }

    // 5. Gather tracking details from headers
    const ip = req.ip || (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || '';
    const referrer = req.headers['referer'] || '';

    // Log the click asynchronously to avoid blocking the HTTP redirect response
    this.analyticsService.recordClick(url.id, ip, userAgent, referrer).catch((err) => {
      console.error('Failed to log click analytics:', err);
    });

    // 6. Perform HTTP 302 Redirect to the original URL destination
    return res.redirect(HttpStatus.FOUND, url.longUrl);
  }
}
