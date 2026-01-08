import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CacheService } from '../../cache/cache.service';

// 限流配置装饰器
export const RateLimit = (limit: number, window: number) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata('rateLimit', { limit, window }, descriptor.value);
    return descriptor;
  };
};

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private cacheService: CacheService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const handler = context.getHandler();
    const rateLimitConfig = Reflect.getMetadata('rateLimit', handler);

    if (!rateLimitConfig) {
      return true; // 没有配置限流，直接通过
    }

    const request = context.switchToHttp().getRequest();
    const { limit, window } = rateLimitConfig;

    // 获取用户标识（优先使用userId，其次IP）
    const userId = request.user?.userId;
    const ip = request.ip || request.connection.remoteAddress;
    const identifier = userId || ip;

    // 获取请求路径作为action
    const action = `${request.method}:${request.route?.path || request.url}`;

    // 生成限流键
    const key = this.cacheService.getRateLimitKey(identifier, action);

    // 增加计数
    const count = await this.cacheService.increment(key, window);

    // 检查是否超过限制
    if (count > limit) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `请求过于频繁，请${window}秒后再试`,
          retryAfter: window,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // 在响应头中添加限流信息
    const response = context.switchToHttp().getResponse();
    response.setHeader('X-RateLimit-Limit', limit);
    response.setHeader('X-RateLimit-Remaining', Math.max(0, limit - count));
    response.setHeader('X-RateLimit-Reset', Date.now() + window * 1000);

    return true;
  }
}
