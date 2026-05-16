import { Bot } from 'grammy';
import { BotContext } from '../types';
import { requireAdmin, requireGroup } from '../middleware';
import { modActionsKeyboard } from '../utils/menus';
import { userService } from '../services/user.service';
import { warningService } from '../services/warning.service';
import { punishmentService } from '../services/punishment.service';
import { logService } from '../services/log.service';
import { mention } from '../utils/helpers';
import { LogAction, PunishmentType } from '@prisma/client';

export function registerActionsCommand(bot: Bot<BotContext>): void {
  // /actions — reply qilingan xabar uchun tezkor tugmalar
  bot.command('actions', requireGroup, requireAdmin, async (ctx) => {
    const target = ctx.message?.reply_to_message?.from;
    if (!target) {
      return ctx.reply('❌ Foydalanuvchining xabariga reply qilib /actions yozing.');
    }
    if (target.is_bot) return ctx.reply('❌ Botlarga qo\'llab bo\'lmaydi.');

    await ctx.reply(
      `🛡 <b>${mention(target.id, target.first_name)}</b> uchun amallar:`,
      {
        parse_mode: 'HTML',
        reply_markup: modActionsKeyboard(target.id),
        reply_to_message_id: ctx.message?.message_id,
      },
    );
  });

  // mod:<action>:<userId>
  bot.callbackQuery(/^mod:(warn|mute60|kick|ban|unmute|unban|close):(\d+)?$/, requireAdmin, async (ctx) => {
    if (!ctx.from) return ctx.answerCallbackQuery();
    const [, action, userIdStr] = ctx.match;

    if (action === 'close') {
      await ctx.deleteMessage().catch(() => {});
      await ctx.answerCallbackQuery();
      return;
    }

    if (!ctx.group || !userIdStr) return ctx.answerCallbackQuery();
    const telegramUserId = parseInt(userIdStr, 10);

    // Ensure user record
    const tgUser = await ctx.api.getChatMember(ctx.chat!.id, telegramUserId).catch(() => null);
    const firstName = tgUser?.user.first_name ?? 'user';
    const dbUser = await userService.getOrCreate(BigInt(telegramUserId), firstName);

    const opts = {
      groupId: ctx.group.id,
      userId: dbUser.id,
      telegramGroupId: BigInt(ctx.chat!.id),
      telegramUserId,
      reason: 'Admin action via /actions',
      issuedBy: ctx.from.id,
    };

    let label = '';
    switch (action) {
      case 'warn':
        await warningService.add(ctx.group.id, dbUser.id, ctx.from.id, opts.reason);
        await logService.log(ctx.group.id, LogAction.USER_WARNED, dbUser.id);
        label = '⚠️ Warn berildi';
        break;
      case 'mute60':
        await punishmentService.apply(bot, { ...opts, duration: 60 }, PunishmentType.TEMP_MUTE, 60);
        label = '🔇 Mute 1h';
        break;
      case 'kick':
        await punishmentService.apply(bot, opts, PunishmentType.KICK);
        label = '👢 Kick';
        break;
      case 'ban':
        await punishmentService.apply(bot, opts, PunishmentType.BAN);
        label = '🚫 Ban';
        break;
      case 'unmute':
        await punishmentService.unmute(bot, BigInt(ctx.chat!.id), telegramUserId, ctx.group.id, dbUser.id);
        label = '🔊 Unmute';
        break;
      case 'unban':
        await punishmentService.unban(bot, BigInt(ctx.chat!.id), telegramUserId, ctx.group.id, dbUser.id);
        label = '✅ Unban';
        break;
    }

    await ctx.answerCallbackQuery(label);
    // Update message to show action history
    await ctx.editMessageText(
      `🛡 <b>${mention(telegramUserId, firstName)}</b>\n\nOxirgi amal: <b>${label}</b>`,
      { parse_mode: 'HTML', reply_markup: modActionsKeyboard(telegramUserId) },
    );
  });
}
