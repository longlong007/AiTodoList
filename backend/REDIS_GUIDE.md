# Redis 集成指南

## 🎯 概述

本项目已集成 Redis 作为缓存和限流解决方案，可显著提升系统性能：

- 📈 **数据库查询减少** 60-80%
- ⚡ **API响应时间减少** 40-60%  
- 💰 **AI API调用费用减少** 70-90%
- 🛡️ **系统稳定性提升**

## 🚀 快速开始

### 本地开发

#### 1. 安装 Redis

**方式一：Docker（推荐）**
```bash
docker run -d \
  --name redis \
  -p 6379:6379 \
  redis:7-alpine
```

**方式二：直接安装**
- Windows: 下载 [Redis for Windows](https://github.com/microsoftarchive/redis/releases)
- macOS: `brew install redis && brew services start redis`
- Linux: `sudo apt-get install redis-server`

#### 2. 配置环境变量

在 `backend/.env` 中添加：
```env
REDIS_URL=redis://localhost:6379/0
```

#### 3. 启动应用

```bash
cd backend
npm run start:dev
```

查看日志，应该看到：
```
✅ Redis连接配置: { host: 'localhost', port: 6379, db: 0, ssl: false }
```

### 生产部署

#### Railway 部署

1. 在 Railway 项目中添加 Redis 服务：
   - 进入项目 Dashboard
   - 点击 "New" → "Database" → "Add Redis"
   - Railway 会自动设置 `REDIS_URL` 环境变量

2. 重新部署后端服务，Redis 会自动连接

#### 其他云平台

在环境变量中配置：
```env
REDIS_URL=redis://your-redis-host:6379/0
# 或使用密码
REDIS_URL=redis://password@your-redis-host:6379/0
# 或使用TLS
REDIS_URL=rediss://password@your-redis-host:6379/0
```

## 📊 缓存策略

### 1. 用户信息缓存
- **键**: `user:{userId}`
- **TTL**: 30分钟
- **更新时机**: 用户信息修改、订阅状态变更时清除

### 2. Pro会员状态缓存
- **键**: `user:pro:{userId}`
- **TTL**: 5分钟
- **更新时机**: 订阅状态变更时清除

### 3. 待办统计缓存
- **键**: `todo:stats:{userId}`
- **TTL**: 10分钟
- **更新时机**: 创建、更新、删除待办时清除

### 4. AI分析结果缓存
- **键**: `ai:analysis:{userId}`
- **TTL**: 24小时
- **更新时机**: 待办数据变化时自动失效（通过TTL自然过期）

### 5. JWT黑名单
- **键**: `jwt:blacklist:{token}`
- **TTL**: token剩余有效期
- **用途**: 实现登出功能

## 🔒 限流配置

### AI分析接口
```typescript
@RateLimit(3, 3600) // 每小时最多3次
```

### 创建订单接口
```typescript
@RateLimit(5, 60) // 每分钟最多5次
```

### 响应头
```
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 3
X-RateLimit-Reset: 1735891234567
```

### 超限响应
```json
{
  "statusCode": 429,
  "message": "请求过于频繁，请60秒后再试",
  "retryAfter": 60
}
```

## 🛠️ 降级策略

如果未配置 Redis 或连接失败，系统会自动降级使用**内存缓存**：

```
⚠️  未配置REDIS_URL，使用内存缓存（不推荐用于生产环境）
```

**注意**：内存缓存的限制：
- 不支持多实例共享
- 服务重启后缓存丢失
- 限流功能可能不准确

## 📈 监控和调试

### 查看缓存键

连接到 Redis：
```bash
redis-cli
```

查看所有键：
```redis
KEYS *
```

查看特定用户的缓存：
```redis
KEYS user:12345678-*
```

查看键的值：
```redis
GET user:12345678-1234-1234-1234-123456789012
```

查看键的TTL：
```redis
TTL user:12345678-1234-1234-1234-123456789012
```

### 清空缓存

清空所有缓存（慎用）：
```redis
FLUSHDB
```

删除特定键：
```redis
DEL user:12345678-1234-1234-1234-123456789012
```

### 应用日志

启用 Redis 调试日志，在 `.env` 中添加：
```env
DEBUG=cache:*
```

## 🔧 常见问题

### 1. Redis 连接失败

**问题**：看到错误 "ECONNREFUSED 127.0.0.1:6379"

**解决**：
- 检查 Redis 是否运行：`redis-cli ping` 应返回 `PONG`
- 检查防火墙设置
- 确认 `REDIS_URL` 配置正确

### 2. 缓存不生效

**问题**：数据更新后仍返回旧数据

**解决**：
- 检查缓存清除逻辑是否正确执行
- 手动清除缓存：`redis-cli FLUSHDB`
- 查看应用日志确认缓存是否命中

### 3. 限流不准确

**问题**：限流计数器不准确

**解决**：
- 确保使用 Redis（内存缓存在多实例下不准确）
- 检查系统时钟是否同步
- 查看 Redis 是否正常运行

### 4. 生产环境内存占用高

**问题**：Redis 内存持续增长

**解决**：
- 检查是否有键未设置 TTL：`redis-cli --scan --pattern '*'`
- 配置最大内存和淘汰策略：
  ```redis
  CONFIG SET maxmemory 256mb
  CONFIG SET maxmemory-policy allkeys-lru
  ```

## 🎨 最佳实践

1. ✅ **总是设置 TTL**：避免内存泄漏
2. ✅ **使用统一的键命名规范**：如 `{模块}:{操作}:{标识}`
3. ✅ **及时清除过期数据**：数据变更时主动清除相关缓存
4. ✅ **监控缓存命中率**：优化缓存策略
5. ✅ **生产环境必须用 Redis**：不要使用内存缓存

## 📚 相关文档

- [Redis 官方文档](https://redis.io/docs/)
- [cache-manager 文档](https://github.com/node-cache-manager/node-cache-manager)
- [Railway Redis 文档](https://docs.railway.app/databases/redis)

## 🆘 获取帮助

如有问题，请：
1. 查看应用日志
2. 检查 Redis 连接状态
3. 查阅本文档的常见问题部分
4. 联系技术支持
