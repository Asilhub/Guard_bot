import { Bot } from 'grammy';
import { BotContext } from '../../types';
import { spamService } from '../../services/spam.service';
import { punishmentService } from '../../services/punishment.service';
import { userService } from '../../services/user.service';
import { logService } from '../../services/log.service';
import { LogAction, PunishmentType } from '@prisma/client';
import { mention } from '../../utils/helpers';
import { createModuleLogger } from '../../utils/logger';

const log = createModuleLogger('antispam');

export function registerAntispamEvents(bot: Bot<BotContext>): void {
  bot.on('message', async (ctx, next) => {
    const settings = ctx.group?.settings;
    if (!settings?.antispamEnabled || !ctx.group || !ctx.from || ctx.from.is_bot) return next();

    const dbUser = ctx.dbUser;
    if (!dbUser) return next();

    // Skip whitelisted
    const isWhitelisted = await userService.isWhitelisted(ctx.group.id, dbUser.id);
    if (isWhitelisted) return next();

    const result = await spamService.check(ctx.message, settings, BigInt(ctx.chat.id));
    if (!result.isSpam) return next();

    log.info(`Spam detected: ${result.reason} (score: ${result.score}) from ${ctx.from.id}`);

    try {
      await ctx.deleteMessage();
    } catch {
      // already deleted
    }

    await logService.log(ctx.group.id, LogAction.SPAM_DETECTED, dbUser.id, {
      reason: result.reason,
      score: result.score,
    });

    // Determine punishment by spam score
    const type = result.score >= 9
      ? PunishmentType.BAN
      : result.score >= 7
        ? PunishmentType.TEMP_MUTE
        : PunishmentType.MUTE;

    const duration = type === PunishmentType.TEMP_MUTE ? settings.warnMuteDuration : undefined;

    await punishmentService.apply(bot, {
      groupId: ctx.group.id,
      userId: dbUser.id,
      telegramGroupId: BigInt(ctx.chat.id),
      telegramUserId: ctx.from.id,
      reason: result.reason,
      duration,
      issuedBy: ctx.me.id,
    }, type);

    if (!settings.silentMode) {
      const msg = await ctx.reply(
        `🚨 ${mention(ctx.from.id, ctx.from.first_name)} — spam aniqlandi: ${result.reason}`,
        { parse_mode: 'HTML' },
      );
      setTimeout(() => ctx.api.deleteMessage(ctx.chat.id, msg.message_id).catch(() => {}), 8000);
    }
  });
}
