import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  /**
   * 获取缓存
   */
  async get<T>(key: string): Promise<T | undefined> {
    try {
      return await this.cacheManager.get<T>(key);
    } catch (error) {
      console.error(`缓存获取失败 [${key}]:`, error.message);
      return undefined;
    }
  }

  /**
   * 设置缓存
   * @param key 键
   * @param value 值
   * @param ttl 过期时间（秒），0表示永不过期
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      if (ttl === 0) {
        // 永不过期
        await this.cacheManager.set(key, value, 0);
      } else {
        await this.cacheManager.set(key, value, ttl || 1800);
      }
    } catch (error) {
      console.error(`缓存设置失败 [${key}]:`, error.message);
    }
  }

  /**
   * 删除缓存
   */
  async del(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
    } catch (error) {
      console.error(`缓存删除失败 [${key}]:`, error.message);
    }
  }

  /**
   * 删除匹配的所有键（支持通配符）
   */
  async delPattern(pattern: string): Promise<void> {
    try {
      // cache-manager v7+ 使用 stores 数组
      const store: any = (this.cacheManager as any).store;
      
      // 如果是ioredis，支持pattern删除
      if (store && store.client && typeof store.client.keys === 'function') {
        const keys = await store.client.keys(pattern);
        if (keys.length > 0) {
          await Promise.all(keys.map((key: string) => this.del(key)));
        }
      }
    } catch (error) {
      console.error(`批量缓存删除失败 [${pattern}]:`, error.message);
    }
  }

  /**
   * 清空所有缓存
   */
  async reset(): Promise<void> {
    try {
      // cache-manager v7 移除了 reset() 方法
      // 尝试直接访问Redis client执行FLUSHDB
      const store: any = (this.cacheManager as any).store;
      
      if (store && store.client && typeof store.client.flushdb === 'function') {
        await store.client.flushdb();
      } else {
        console.warn('⚠️  缓存清空功能在当前配置下不可用（需要Redis）');
      }
    } catch (error) {
      console.error('缓存清空失败:', error.message);
    }
  }

  /**
   * 生成用户缓存键
   */
  getUserKey(userId: string): string {
    return `user:${userId}`;
  }

  /**
   * 生成用户Pro状态缓存键
   */
  getUserProKey(userId: string): string {
    return `user:pro:${userId}`;
  }

  /**
   * 生成待办统计缓存键
   */
  getTodoStatsKey(userId: string): string {
    return `todo:stats:${userId}`;
  }

  /**
   * 生成AI分析缓存键
   */
  getAiAnalysisKey(userId: string): string {
    return `ai:analysis:${userId}`;
  }

  /**
   * 生成JWT黑名单键
   */
  getJwtBlacklistKey(token: string): string {
    return `jwt:blacklist:${token}`;
  }

  /**
   * 生成限流键
   */
  getRateLimitKey(identifier: string, action: string): string {
    return `ratelimit:${action}:${identifier}`;
  }

  /**
   * 生成支付锁键
   */
  getPaymentLockKey(orderNo: string): string {
    return `payment:lock:${orderNo}`;
  }

  /**
   * 增加计数器（用于限流）
   * @param key 键
   * @param ttl 过期时间（秒）
   * @returns 当前计数
   */
  async increment(key: string, ttl: number): Promise<number> {
    try {
      // cache-manager v7+ 需要通过类型断言访问store
      const store: any = (this.cacheManager as any).store;
      
      if (store && store.client && typeof store.client.incr === 'function') {
        const count = await store.client.incr(key);
        if (count === 1) {
          // 第一次设置，添加过期时间
          await store.client.expire(key, ttl);
        }
        return count;
      }
      
      // 降级方案：使用普通get/set模拟
      const current = (await this.get<number>(key)) || 0;
      const newCount = current + 1;
      await this.set(key, newCount, ttl);
      return newCount;
    } catch (error) {
      console.error(`计数器增加失败 [${key}]:`, error.message);
      return 0;
    }
  }

  /**
   * 设置分布式锁（用于支付幂等性）
   * @param key 锁键
   * @param ttl 锁过期时间（秒）
   * @returns 是否获取锁成功
   */
  async acquireLock(key: string, ttl: number = 10): Promise<boolean> {
    try {
      // cache-manager v7+ 需要通过类型断言访问store
      const store: any = (this.cacheManager as any).store;
      
      if (store && store.client && typeof store.client.set === 'function') {
        // 使用SETNX实现分布式锁
        const result = await store.client.set(key, '1', 'EX', ttl, 'NX');
        return result === 'OK';
      }
      
      // 降级方案
      const exists = await this.get(key);
      if (exists) {
        return false;
      }
      await this.set(key, true, ttl);
      return true;
    } catch (error) {
      console.error(`获取锁失败 [${key}]:`, error.message);
      return false;
    }
  }

  /**
   * 释放分布式锁
   */
  async releaseLock(key: string): Promise<void> {
    await this.del(key);
  }
}
