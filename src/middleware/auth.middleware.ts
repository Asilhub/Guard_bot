import { NextFunction } from 'grammy';
import { BotContext } from '../types';
import { isGroupAdmin, isModerator } from '../utils/permissions';

export function requireAdmin(ctx: BotContext, next: NextFunction): Promise<void> {
  if (!isGroupAdmin(ctx)) {
    return ctx.reply('⛔ Bu buyruq faqat adminlar uchun.').then(() => undefined);
  }
  return next();
}

export function requireModerator(ctx: BotContext, next: NextFunction): Promise<void> {
  if (!isModerator(ctx)) {
    return ctx.reply('⛔ Bu buyruq faqat moderatorlar uchun.').then(() => undefined);
  }
  return next();
}

export function requireGroup(ctx: BotContext, next: NextFunction): Promise<void> {
  if (ctx.chat?.type === 'private') {
    return ctx.reply('⛔ Bu buyruq faqat guruhlarda ishlaydi.').then(() => undefined);
  }
  return next();
}
