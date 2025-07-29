import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check(): {
    status: string;
    timestamp: string;
    uptime: number;
    environment: string;
  } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    };
  }

  @Get('ready')
  ready(): { status: string; message: string } {
    return {
      status: 'ready',
      message: 'Service is ready to accept requests',
    };
  }

  @Get('live')
  live(): { status: string; message: string } {
    return {
      status: 'alive',
      message: 'Service is running',
    };
  }
}
