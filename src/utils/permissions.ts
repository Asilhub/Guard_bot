import { BotContext } from '../types';
import { Role } from '@prisma/client';
import { config } from '../configs';

export function isOwner(ctx: BotContext): boolean {
  return ctx.from?.id === config.bot.ownerId;
}

export function isGroupAdmin(ctx: BotContext): boolean {
  const role = ctx.memberRole;
  return role === Role.OWNER || role === Role.ADMIN;
}

export function isModerator(ctx: BotContext): boolean {
  const role = ctx.memberRole;
  return role === Role.OWNER || role === Role.ADMIN || role === Role.MODERATOR;
}

export function hasRole(ctx: BotContext, minRole: Role): boolean {
  const roleHierarchy: Record<Role, number> = {
    [Role.MEMBER]: 0,
    [Role.MODERATOR]: 1,
    [Role.ADMIN]: 2,
    [Role.OWNER]: 3,
  };
  const userLevel = roleHierarchy[ctx.memberRole ?? Role.MEMBER];
  const requiredLevel = roleHierarchy[minRole];
  return userLevel >= requiredLevel;
}

export function isTelegramAdmin(status: string): boolean {
  return status === 'administrator' || status === 'creator';
}

export async function checkTelegramAdmin(ctx: BotContext, userId: number): Promise<boolean> {
  if (!ctx.chat || ctx.chat.type === 'private') return false;
  try {
    const member = await ctx.getChatMember(userId);
    return isTelegramAdmin(member.status);
  } catch {
    return false;
  }
}
