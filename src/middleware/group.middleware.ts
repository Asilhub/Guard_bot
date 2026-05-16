import { NextFunction } from 'grammy';
import { BotContext } from '../types';
import { groupService } from '../services/group.service';
import { userService } from '../services/user.service';
import { Role } from '@prisma/client';
import { checkTelegramAdmin } from '../utils/permissions';

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
    if (member) {
      ctx.memberRole = member.role;
    } else {
      // Sync with Telegram admin status
      const isTgAdmin = await checkTelegramAdmin(ctx, from.id);
      const role = isTgAdmin ? Role.ADMIN : Role.MEMBER;
      await userService.getOrCreateMember(group.id, dbUser.id, role);
      ctx.memberRole = role;
    }
  }

  return next();
}
