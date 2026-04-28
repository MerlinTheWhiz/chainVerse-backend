import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-yet';

/**
 * Upgrades the cache store to Redis when REDIS_URL is present so cached data
 * survives deploys. Falls back to in-memory only in local / CI environments
 * where no Redis URL is configured. Closes #402.
 */
@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => {
        const url = config.get<string>('redis.url');
        const ttl = parseInt(process.env.CACHE_TTL_MS ?? '300000', 10);
        const max = parseInt(process.env.CACHE_MAX_ITEMS ?? '1000', 10);

        if (url) {
          return {
            store: await redisStore({ socket: { url }, ttl: ttl / 1000 }),
          };
        }

        return { ttl, max };
      },
      inject: [ConfigService],
    }),
  ],
  exports: [CacheModule],
})
export class AppCacheModule {}
