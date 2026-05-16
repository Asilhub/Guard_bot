import { Bot } from 'grammy';
import { BotContext } from '../../types';
import { warningService } from '../../services/warning.service';
import { punishmentService } from '../../services/punishment.service';
import { userService } from '../../services/user.service';
import { logService } from '../../services/log.service';
import { requireAdmin, requireGroup } from '../../middleware';
import { formatWarnList } from '../../utils/formatters';
import { mention } from '../../utils/helpers';
import { LogAction, PunishmentType } from '@prisma/client';
import { warnKeyboard } from '../../utils/keyboards';

export function registerWarnsCommands(bot: Bot<BotContext>): void {
  // /warn [reason]
  bot.command('warn', requireGroup, requireAdmin, async (ctx) => {
    if (!ctx.group || !ctx.from) return;

    const target = ctx.message?.reply_to_message?.from;
    if (!target) return ctx.reply('❌ Reply qiling (javob bering) warn berish uchun.');
    if (target.is_bot) return ctx.reply('❌ Botga warn berib bo\'lmaydi.');

    const reason = ctx.match?.trim() || undefined;
    const dbUser = await userService.getOrCreate(BigInt(target.id), target.first_name, target.last_name, target.username);
    const member = await userService.getOrCreateMember(ctx.group.id, dbUser.id);

    await warningService.add(ctx.group.id, dbUser.id, ctx.from.id, reason);
    await logService.log(ctx.group.id, LogAction.USER_WARNED, dbUser.id, { reason });

    const warnCount = await warningService.count(ctx.group.id, dbUser.id);
    const limit = ctx.group.settings?.warnLimit ?? 3;

    if (warnCount >= limit) {
      const action = ctx.group.settings?.warnAction ?? PunishmentType.BAN;
      const duration = ctx.group.settings?.warnMuteDuration;

      await punishmentService.apply(bot, {
        groupId: ctx.group.id,
        userId: dbUser.id,
        telegramGroupId: BigInt(ctx.chat.id),
        telegramUserId: target.id,
        reason: `Warn limiti (${warnCount}/${limit}) oshdi`,
        duration: action === PunishmentType.TEMP_MUTE ? duration : undefined,
        issuedBy: ctx.from.id,
      }, action);

      await warningService.removeAll(ctx.group.id, dbUser.id);

      return ctx.reply(
        `⚠️ ${mention(target.id, target.first_name)} — ${warnCount}/${limit} warn. Limit oshdi → <b>${action}</b> qilindi.`,
        { parse_mode: 'HTML' },
      );
    }

    await ctx.reply(
      `⚠️ ${mention(target.id, target.first_name)} ogohlantirildi${reason ? `: ${reason}` : ''}\nWarnlar: <b>${warnCount}/${limit}</b>`,
      {
        parse_mode: 'HTML',
        reply_markup: warnKeyboard(target.id, ctx.group.id),
      },
    );
  });

  // /unwarn
  bot.command('unwarn', requireGroup, requireAdmin, async (ctx) => {
    if (!ctx.group || !ctx.from) return;

    const target = ctx.message?.reply_to_message?.from;
    if (!target) return ctx.reply('❌ Reply qiling.');

    const dbUser = await userService.getByTelegramId(BigInt(target.id));
    if (!dbUser) return ctx.reply('❌ Foydalanuvchi topilmadi.');

    const removed = await warningService.removeLatest(ctx.group.id, dbUser.id);
    await logService.log(ctx.group.id, LogAction.WARNING_REMOVED, dbUser.id);

    await ctx.reply(
      removed
        ? `✅ ${mention(target.id, target.first_name)} oxirgi warni olib tashlandi.`
        : `❌ ${mention(target.id, target.first_name)} da warn yo'q.`,
      { parse_mode: 'HTML' },
    );
  });

  // /warns
  bot.command('warns', requireGroup, requireAdmin, async (ctx) => {
    if (!ctx.group) return;

    const target = ctx.message?.reply_to_message?.from ?? ctx.from;
    if (!target) return;

    const dbUser = await userService.getByTelegramId(BigInt(target.id));
    if (!dbUser) return ctx.reply('❌ Foydalanuvchi topilmadi.');

    const warns = await warningService.list(ctx.group.id, dbUser.id);
    await ctx.reply(formatWarnList(warns, target.first_name), { parse_mode: 'HTML' });
  });

  // Inline action buttons from /warn
  bot.callbackQuery(/^action:(mute|kick|ban|unwarn):(\d+)$/, requireAdmin, async (ctx) => {
    if (!ctx.group || !ctx.from) return ctx.answerCallbackQuery();
    const [, action, userIdStr] = ctx.match;
    const telegramUserId = parseInt(userIdStr);

    const dbUser = await userService.getByTelegramId(BigInt(telegramUserId));
    if (!dbUser) return ctx.answerCallbackQuery('Foydalanuvchi topilmadi');

    const actionMap: Record<string, PunishmentType> = {
      mute: PunishmentType.MUTE,
      kick: PunishmentType.KICK,
      ban: PunishmentType.BAN,
    };

    if (action === 'unwarn') {
      await warningService.removeLatest(ctx.group.id, dbUser.id);
      await ctx.answerCallbackQuery('✅ Warn olib tashlandi');
      await ctx.editMessageReplyMarkup({ reply_markup: undefined });
      return;
    }

    const punishType = actionMap[action];
    if (punishType) {
      await punishmentService.apply(bot, {
        groupId: ctx.group.id,
        userId: dbUser.id,
        telegramGroupId: BigInt(ctx.chat!.id),
        telegramUserId,
        reason: 'Admin action',
        issuedBy: ctx.from.id,
      }, punishType);
      await ctx.answerCallbackQuery(`✅ ${action} qilindi`);
      await ctx.editMessageReplyMarkup({ reply_markup: undefined });
    }
  });
}
