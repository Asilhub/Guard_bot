import { NextFunction } from 'grammy';
import { BotContext } from '../types';
import { createModuleLogger } from '../utils/logger';

const log = createModuleLogger('middleware');

export async function loggingMiddleware(ctx: BotContext, next: NextFunction): Promise<void> {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;

  if (ctx.message && ctx.from) {
    log.debug(`[message] ${ctx.from.id} in ${ctx.chat?.id} — ${ms}ms`);
  }
}
