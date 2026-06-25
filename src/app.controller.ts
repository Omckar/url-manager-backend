import { Controller, Get } from '@nestjs/common';

@Controller('api')
export class AppController {
  @Get()
  getHealth(): { status: string; message: string; timestamp: string } {
    return {
      status: 'up',
      message: 'URL Management Platform API is running.',
      timestamp: new Date().toISOString(),
    };
  }
}
