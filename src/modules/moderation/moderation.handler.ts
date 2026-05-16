import { Bot } from 'grammy';
import { BotContext } from '../../types';
import { userService } from '../../services/user.service';
import { cacheService } from '../../services/cache.service';
import { logService } from '../../services/log.service';
import { LogAction } from '@prisma/client';
import { mention } from '../../utils/helpers';
import { createModuleLogger } from '../../utils/logger';

const log = createModuleLogger('moderation');

const INVITE_LINK_REGEX = /t\.me\/(?:joinchat\/|\+)[a-zA-Z0-9_-]+/i;

export function registerModerationEvents(bot: Bot<BotContext>): void {
  bot.on('message:text', async (ctx, next) => {
    const settings = ctx.group?.settings;
    if (!ctx.group || !ctx.from || ctx.from.is_bot) return next();

    const dbUser = ctx.dbUser;
    if (!dbUser) return next();

    // Whitelist check — skip all moderation for whitelisted users
    const isWhitelisted = await userService.isWhitelisted(ctx.group.id, dbUser.id);
    if (isWhitelisted) return next();

    const text = ctx.message.text;

    // Filter Telegram invite links
    if (settings?.filterInviteLinks && INVITE_LINK_REGEX.test(text)) {
      try { await ctx.deleteMessage(); } catch {}
      await logService.log(ctx.group.id, LogAction.MESSAGE_DELETED, dbUser.id, {
        reason: 'Invite link filtered',
      });
      if (!settings.silentMode) {
        const msg = await ctx.reply(
          `🔗 ${mention(ctx.from.id, ctx.from.first_name)} — guruhga taklif linki taqiqlangan!`,
          { parse_mode: 'HTML' },
        );
        setTimeout(() => ctx.api.deleteMessage(ctx.chat.id, msg.message_id).catch(() => {}), 5000);
      }
      log.debug(`Invite link removed from ${ctx.from.id}`);
      return;
    }

    // New user restriction bypass check
    if (settings?.restrictNewUsers) {
      const isNew = await cacheService.isNewUser(BigInt(ctx.chat.id), ctx.from.id);
      if (isNew) {
        try { await ctx.deleteMessage(); } catch {}
        return;
      }
    }

    return next();
  });
}
