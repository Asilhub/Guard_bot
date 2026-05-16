import { Bot } from 'grammy';
import { BotContext } from '../../types';
import { keywordService } from '../../services/keyword.service';
import { punishmentService } from '../../services/punishment.service';
import { userService } from '../../services/user.service';
import { logService } from '../../services/log.service';
import { LogAction, PunishmentType } from '@prisma/client';
import { mention } from '../../utils/helpers';
import { createModuleLogger } from '../../utils/logger';

const log = createModuleLogger('keyword');

export function registerKeywordEvents(bot: Bot<BotContext>): void {
  bot.on('message:text', async (ctx, next) => {
    const settings = ctx.group?.settings;
    if (!settings?.keywordEnabled || !ctx.group || !ctx.from || ctx.from.is_bot) return next();

    const dbUser = ctx.dbUser;
    if (!dbUser) return next();

    // Skip whitelisted users
    const isWhitelisted = await userService.isWhitelisted(ctx.group.id, dbUser.id);
    if (isWhitelisted) return next();

    const text = ctx.message.text ?? '';
    const matched = await keywordService.check(ctx.group.id, text);
    if (!matched) return next();

    log.info(`Keyword match: "${matched.pattern}" in group ${ctx.chat.id}`);

    try {
      await ctx.deleteMessage();
    } catch {
      // Message may already be deleted
    }

    const userName = ctx.from.first_name;
    const userId = ctx.from.id;
    const groupId = ctx.group.id;

    await logService.log(groupId, LogAction.MESSAGE_DELETED, dbUser.id, {
      reason: `Keyword: ${matched.pattern}`,
    });

    await punishmentService.apply(bot, {
      groupId,
      userId: dbUser.id,
      telegramGroupId: BigInt(ctx.chat.id),
      telegramUserId: userId,
      reason: `Taqiqlangan so'z: ${matched.pattern}`,
      issuedBy: ctx.me.id,
    }, matched.action as PunishmentType);

    if (!settings.silentMode) {
      const actionText: Record<string, string> = {
        MUTE: '🔇 mute qilindi',
        BAN: '🚫 ban qilindi',
        KICK: '👢 kick qilindi',
        DELETE: '🗑 xabari o\'chirildi',
      };
      const msg = await ctx.reply(
        `⚠️ ${mention(userId, userName)} — taqiqlangan so'z ishlatildi. ${actionText[matched.action] ?? ''}`,
        { parse_mode: 'HTML' },
      );

      if (matched.action === PunishmentType.DELETE) {
        setTimeout(() => ctx.api.deleteMessage(ctx.chat.id, msg.message_id).catch(() => {}), 5000);
      }
    }
  });
}
