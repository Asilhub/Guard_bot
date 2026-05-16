import Redis from 'ioredis';
import { config } from '../configs';
import { logger } from '../utils/logger';

export const redis = new Redis(config.redis.url, {
  password: config.redis.password || undefined,
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => Math.min(times * 100, 3000),
  lazyConnect: true,
});

redis.on('connect', () => logger.info('Redis connected'));
redis.on('error', (err) => logger.error('Redis error', err));
redis.on('reconnecting', () => logger.warn('Redis reconnecting'));

export async function connectRedis(): Promise<void> {
  await redis.connect();
}

export async function disconnectRedis(): Promise<void> {
  await redis.quit();
  logger.info('Redis disconnected');
}
