import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class CorsMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const origin = req.headers.origin;
    const allowedOrigins = this.getAllowedOrigins();

    // Set CORS headers
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else if (this.isDevelopment()) {
      // In development, allow all origins
      res.setHeader('Access-Control-Allow-Origin', '*');
    }

    res.setHeader(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    );

    res.setHeader(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control',
    );

    res.setHeader('Access-Control-Allow-Credentials', 'true');

    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    next();
  }

  private getAllowedOrigins(): string[] {
    const envOrigins = process.env.ALLOWED_ORIGINS;
    if (envOrigins) {
      return envOrigins.split(',').map((origin) => origin.trim());
    }

    // Default allowed origins
    return [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:8080',
      'https://your-domain.com',
    ];
  }

  private isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development';
  }
}
