import { NextFunction } from 'grammy';
import { BotContext } from '../types';
import { groupService } from '../services/group.service';
import { userService } from '../services/user.service';
import { Role } from '@prisma/client';
import { checkTelegramAdmin } from '../utils/permissions';
import { config } from '../configs';
import { logger } from '../utils/logger';

const GROUP_ANONYMOUS_BOT_ID = 1087968824;

export async function groupMiddleware(ctx: BotContext, next: NextFunction): Promise<void> {
  if (!ctx.chat || ctx.chat.type === 'private') return next();

  const chat = ctx.chat;
  const from = ctx.from;

  // Register group
  const group = await groupService.getOrCreate(
    BigInt(chat.id),
    'title' in chat ? chat.title : '',
    'username' in chat ? chat.username : undefined,
  );
  ctx.group = group;

  // Anonymous admin (posting as the group) → grant ADMIN
  if (from?.is_bot && from.id === GROUP_ANONYMOUS_BOT_ID) {
    ctx.memberRole = Role.ADMIN;
    return next();
  }

  // Bot owner from .env → always OWNER
  if (from && from.id === config.bot.ownerId) {
    ctx.memberRole = Role.OWNER;
    const dbUser = await userService.getOrCreate(
      BigInt(from.id), from.first_name, from.last_name, from.username,
    );
    ctx.dbUser = dbUser;
    await userService.setRole(group.id, dbUser.id, Role.OWNER).catch(() => {});
    return next();
  }

  // Register user and resolve role
  if (from && !from.is_bot) {
    const dbUser = await userService.getOrCreate(
      BigInt(from.id),
      from.first_name,
      from.last_name,
      from.username,
    );
    ctx.dbUser = dbUser;

    const member = await userService.getMember(group.id, dbUser.id);
    const isTgAdmin = await checkTelegramAdmin(ctx, from.id);
    const tgRole = isTgAdmin ? Role.ADMIN : Role.MEMBER;

    if (!member) {
      await userService.getOrCreateMember(group.id, dbUser.id, tgRole);
      ctx.memberRole = tgRole;
    } else {
      // Auto-promote if Telegram says admin but DB hasn't caught up.
      // Don't downgrade — preserve manually-set MODERATOR/OWNER roles.
      if (isTgAdmin && member.role === Role.MEMBER) {
        await userService.setRole(group.id, dbUser.id, Role.ADMIN);
        ctx.memberRole = Role.ADMIN;
      } else {
        ctx.memberRole = member.role;
      }
    }

    logger.debug(`user=${from.id} chat=${chat.id} tgAdmin=${isTgAdmin} role=${ctx.memberRole}`);
  }

  return next();
}
