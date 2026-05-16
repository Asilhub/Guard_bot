import { NextFunction } from 'grammy';
import { BotContext } from '../types';
import { redis } from '../database/redis';
import { config } from '../configs';

export async function rateLimitMiddleware(ctx: BotContext, next: NextFunction): Promise<void> {
  if (!ctx.from || !ctx.chat) return next();

  const key = `ratelimit:${ctx.chat.id}:${ctx.from.id}`;
  const max = config.defaults.rateLimitMax;
  const windowMs = config.defaults.rateLimitWindow;

  const count = await redis.incr(key);
  if (count === 1) await redis.pexpire(key, windowMs);

  if (count > max * 3) {
    // Hard block — too many requests, silently drop
    return;
  }

  return next();
}
