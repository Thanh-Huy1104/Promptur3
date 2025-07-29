import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { CorsMiddleware } from './middleware/cors.middleware';
import { LoggerMiddleware } from './middleware/logger.middleware';

@Module({
  providers: [CorsMiddleware, LoggerMiddleware],
  exports: [CorsMiddleware, LoggerMiddleware],
})
export class CommonModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(LoggerMiddleware, CorsMiddleware).forRoutes('*');
  }
}
