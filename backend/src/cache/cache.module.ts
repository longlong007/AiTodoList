import { Module, Global } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-ioredis';
import { CacheService } from './cache.service';

@Global()
@Module({
  imports: [
    NestCacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL');
        const isProduction = configService.get('NODE_ENV') === 'production';

        // 如果没有配置Redis，使用内存缓存
        if (!redisUrl) {
          console.warn('⚠️  未配置REDIS_URL，使用内存缓存（不推荐用于生产环境）');
          return {
            ttl: 1800000, // 30分钟，使用毫秒
            max: 1000, // 增加到1000项
          };
        }

        try {
          // 解析Redis URL
          const url = new URL(redisUrl);
          const config = {
            store: redisStore,
            host: url.hostname,
            port: parseInt(url.port) || 6379,
            password: url.password || undefined,
            db: parseInt(url.pathname.substring(1)) || 0,
            ttl: 1800, // 默认30分钟
            maxRetriesPerRequest: 3,
            enableReadyCheck: true,
            lazyConnect: false,
          };

          if (isProduction && url.searchParams.get('ssl') !== 'false') {
            config['tls'] = {
              rejectUnauthorized: false, // Railway等云平台需要
            };
          }

          console.log('✅ Redis连接配置:', {
            host: config.host,
            port: config.port,
            db: config.db,
            ssl: !!config['tls'],
          });

          return config;
        } catch (error) {
          console.error('❌ Redis URL解析失败:', error.message);
          console.warn('⚠️  降级使用内存缓存');
          return {
            ttl: 1800000, // 30分钟，使用毫秒
            max: 1000,
          };
        }
      },
      inject: [ConfigService],
    }),
  ],
  providers: [CacheService],
  exports: [NestCacheModule, CacheService],
})
export class CacheModule {}
