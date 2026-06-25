import { Controller, Post, Body, Get, Put, Delete, Param, Query, UseGuards, ParseIntPipe, HttpCode, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { UrlsService } from './urls.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { CreateUrlDto } from '../dto/create-url.dto';
import { UpdateUrlDto } from '../dto/update-url.dto';
import { VerifyUrlPasswordDto } from '../dto/verify-url-password.dto';

@Controller('api/urls')
export class UrlsController {
  constructor(
    private readonly urlsService: UrlsService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@CurrentUser() user: any, @Body() createDto: CreateUrlDto) {
    return this.urlsService.create(user.userId, createDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(
    @CurrentUser() user: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('filter') filter?: string,
    @Query('sortBy') sortBy?: string,
  ) {
    return this.urlsService.findAll(user.userId, { page, limit, search, filter, sortBy });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.urlsService.findOne(id, user.userId);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateUrlDto,
  ) {
    return this.urlsService.update(id, user.userId, updateDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    await this.urlsService.remove(id, user.userId);
    return { message: 'URL deleted successfully' };
  }

  @Post('verify-password')
  @HttpCode(HttpStatus.OK)
  async verifyPassword(@Body() verifyDto: VerifyUrlPasswordDto) {
    const url = await this.urlsService.findByShortCode(verifyDto.shortCode);
    if (!url) {
      throw new UnauthorizedException('URL not found');
    }
    const isCorrect = await this.urlsService.verifyPassword(url.id, verifyDto.password);
    if (!isCorrect) {
      throw new UnauthorizedException('Incorrect password');
    }
    return {
      success: true,
      longUrl: url.longUrl,
    };
  }

  @Get('analytics/:id')
  @UseGuards(JwtAuthGuard)
  async getUrlAnalytics(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    // Confirm ownership of URL first
    await this.urlsService.findOne(id, user.userId);
    return this.analyticsService.getAnalyticsDetails(user.userId, id);
  }
}
