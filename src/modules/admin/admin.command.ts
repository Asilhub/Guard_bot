import { Bot } from 'grammy';
import { BotContext } from '../../types';
import { groupService } from '../../services/group.service';
import { userService } from '../../services/user.service';
import { punishmentService } from '../../services/punishment.service';
import { requireAdmin, requireGroup } from '../../middleware';
import { formatSettingsSummary } from '../../utils/formatters';
import { settingsKeyboard } from '../../utils/keyboards';
import { parseDuration, mention } from '../../utils/helpers';
import { PunishmentType, Role } from '@prisma/client';

export function registerAdminCommands(bot: Bot<BotContext>): void {
  // /settings — main panel
  bot.command('settings', requireGroup, requireAdmin, async (ctx) => {
    if (!ctx.group?.settings) return;
    const s = ctx.group.settings;
    await ctx.reply(formatSettingsSummary(s), {
      parse_mode: 'HTML',
      reply_markup: settingsKeyboard(s),
    });
  });

  // Settings main callbacks
  bot.callbackQuery('settings:main', requireAdmin, async (ctx) => {
    if (!ctx.group?.settings) return ctx.answerCallbackQuery();
    await ctx.editMessageText(formatSettingsSummary(ctx.group.settings), {
      parse_mode: 'HTML',
      reply_markup: settingsKeyboard(ctx.group.settings),
    });
    await ctx.answerCallbackQuery();
  });

  bot.callbackQuery('settings:cleaner', requireAdmin, async (ctx) => {
    if (!ctx.group?.settings) return ctx.answerCallbackQuery();
    const current = ctx.group.settings.cleanerEnabled;
    await groupService.updateSettings(ctx.group.id, { cleanerEnabled: !current });
    const updated = await groupService.getByTelegramId(BigInt(ctx.chat!.id));
    if (!updated?.settings) return ctx.answerCallbackQuery();
    await ctx.editMessageReplyMarkup({ reply_markup: settingsKeyboard(updated.settings) });
    await ctx.answerCallbackQuery(!current ? '✅ Cleaner yoqildi' : '❌ Cleaner o\'chirildi');
  });

  bot.callbackQuery('settings:antispam', requireAdmin, async (ctx) => {
    if (!ctx.group?.settings) return ctx.answerCallbackQuery();
    const current = ctx.group.settings.antispamEnabled;
    await groupService.updateSettings(ctx.group.id, { antispamEnabled: !current });
    const updated = await groupService.getByTelegramId(BigInt(ctx.chat!.id));
    if (!updated?.settings) return ctx.answerCallbackQuery();
    await ctx.editMessageReplyMarkup({ reply_markup: settingsKeyboard(updated.settings) });
    await ctx.answerCallbackQuery(!current ? '✅ Antispam yoqildi' : '❌ Antispam o\'chirildi');
  });

  bot.callbackQuery('settings:protection', requireAdmin, async (ctx) => {
    if (!ctx.group?.settings) return ctx.answerCallbackQuery();
    const current = ctx.group.settings.protectionEnabled;
    await groupService.updateSettings(ctx.group.id, { protectionEnabled: !current });
    const updated = await groupService.getByTelegramId(BigInt(ctx.chat!.id));
    if (!updated?.settings) return ctx.answerCallbackQuery();
    await ctx.editMessageReplyMarkup({ reply_markup: settingsKeyboard(updated.settings) });
    await ctx.answerCallbackQuery(!current ? '✅ Himoya yoqildi' : '❌ Himoya o\'chirildi');
  });

  bot.callbackQuery('settings:keywords', requireAdmin, async (ctx) => {
    if (!ctx.group?.settings) return ctx.answerCallbackQuery();
    const current = ctx.group.settings.keywordEnabled;
    await groupService.updateSettings(ctx.group.id, { keywordEnabled: !current });
    const updated = await groupService.getByTelegramId(BigInt(ctx.chat!.id));
    if (!updated?.settings) return ctx.answerCallbackQuery();
    await ctx.editMessageReplyMarkup({ reply_markup: settingsKeyboard(updated.settings) });
    await ctx.answerCallbackQuery(!current ? '✅ Keywords yoqildi' : '❌ Keywords o\'chirildi');
  });

  bot.callbackQuery('settings:logging', requireAdmin, async (ctx) => {
    if (!ctx.group?.settings) return ctx.answerCallbackQuery();
    const current = ctx.group.settings.logEnabled;
    await groupService.updateSettings(ctx.group.id, { logEnabled: !current });
    const updated = await groupService.getByTelegramId(BigInt(ctx.chat!.id));
    if (!updated?.settings) return ctx.answerCallbackQuery();
    await ctx.editMessageReplyMarkup({ reply_markup: settingsKeyboard(updated.settings) });
    await ctx.answerCallbackQuery(!current ? '✅ Logging yoqildi' : '❌ Logging o\'chirildi');
  });

  bot.callbackQuery('settings:silent', requireAdmin, async (ctx) => {
    if (!ctx.group?.settings) return ctx.answerCallbackQuery();
    const current = ctx.group.settings.silentMode;
    await groupService.updateSettings(ctx.group.id, { silentMode: !current });
    const updated = await groupService.getByTelegramId(BigInt(ctx.chat!.id));
    if (!updated?.settings) return ctx.answerCallbackQuery();
    await ctx.editMessageReplyMarkup({ reply_markup: settingsKeyboard(updated.settings) });
    await ctx.answerCallbackQuery(!current ? '🔇 Silent yoqildi' : '🔊 Silent o\'chirildi');
  });

  // ─── Ban / Unban ────────────────────────────────────────────────────────

  bot.command('ban', requireGroup, requireAdmin, async (ctx) => {
    if (!ctx.group || !ctx.from) return;
    const target = ctx.message?.reply_to_message?.from;
    if (!target) return ctx.reply('❌ Reply qiling.');
    const reason = ctx.match?.trim();
    const dbUser = await userService.getOrCreate(BigInt(target.id), target.first_name);

    await punishmentService.apply(bot, {
      groupId: ctx.group.id,
      userId: dbUser.id,
      telegramGroupId: BigInt(ctx.chat.id),
      telegramUserId: target.id,
      reason,
      issuedBy: ctx.from.id,
    }, PunishmentType.BAN);

    await ctx.reply(`🚫 ${mention(target.id, target.first_name)} ban qilindi.${reason ? `\nSabab: ${reason}` : ''}`, {
      parse_mode: 'HTML',
    });
  });

  bot.command('unban', requireGroup, requireAdmin, async (ctx) => {
    if (!ctx.group || !ctx.from) return;
    const target = ctx.message?.reply_to_message?.from;
    if (!target) return ctx.reply('❌ Reply qiling.');
    const dbUser = await userService.getByTelegramId(BigInt(target.id));
    if (!dbUser) return ctx.reply('❌ Topilmadi.');
    await punishmentService.unban(bot, BigInt(ctx.chat.id), target.id, ctx.group.id, dbUser.id);
    await ctx.reply(`✅ ${mention(target.id, target.first_name)} ban olib tashlandi.`, { parse_mode: 'HTML' });
  });

  // ─── Mute / Unmute ──────────────────────────────────────────────────────

  bot.command('mute', requireGroup, requireAdmin, async (ctx) => {
    if (!ctx.group || !ctx.from) return;
    const target = ctx.message?.reply_to_message?.from;
    if (!target) return ctx.reply('❌ Reply qiling.');

    const args = ctx.match?.trim().split(' ');
    const durationStr = args?.[0];
    const reason = args?.slice(1).join(' ');
    const duration = durationStr ? parseDuration(durationStr) : undefined;

    const dbUser = await userService.getOrCreate(BigInt(target.id), target.first_name);
    const type = duration ? PunishmentType.TEMP_MUTE : PunishmentType.MUTE;

    await punishmentService.apply(bot, {
      groupId: ctx.group.id,
      userId: dbUser.id,
      telegramGroupId: BigInt(ctx.chat.id),
      telegramUserId: target.id,
      reason,
      duration: duration ?? undefined,
      issuedBy: ctx.from.id,
    }, type);

    await ctx.reply(
      `🔇 ${mention(target.id, target.first_name)} mute qilindi${duration ? ` (${durationStr})` : ''}.`,
      { parse_mode: 'HTML' },
    );
  });

  bot.command('unmute', requireGroup, requireAdmin, async (ctx) => {
    if (!ctx.group || !ctx.from) return;
    const target = ctx.message?.reply_to_message?.from;
    if (!target) return ctx.reply('❌ Reply qiling.');
    const dbUser = await userService.getByTelegramId(BigInt(target.id));
    if (!dbUser) return ctx.reply('❌ Topilmadi.');
    await punishmentService.unmute(bot, BigInt(ctx.chat.id), target.id, ctx.group.id, dbUser.id);
    await ctx.reply(`✅ ${mention(target.id, target.first_name)} mute olib tashlandi.`, { parse_mode: 'HTML' });
  });

  // ─── Kick ───────────────────────────────────────────────────────────────

  bot.command('kick', requireGroup, requireAdmin, async (ctx) => {
    if (!ctx.group || !ctx.from) return;
    const target = ctx.message?.reply_to_message?.from;
    if (!target) return ctx.reply('❌ Reply qiling.');
    const dbUser = await userService.getOrCreate(BigInt(target.id), target.first_name);

    await punishmentService.apply(bot, {
      groupId: ctx.group.id,
      userId: dbUser.id,
      telegramGroupId: BigInt(ctx.chat.id),
      telegramUserId: target.id,
      reason: ctx.match?.trim(),
      issuedBy: ctx.from.id,
    }, PunishmentType.KICK);

    await ctx.reply(`👢 ${mention(target.id, target.first_name)} kick qilindi.`, { parse_mode: 'HTML' });
  });

  // ─── Role management ────────────────────────────────────────────────────

  bot.command('promote', requireGroup, requireAdmin, async (ctx) => {
    if (!ctx.group) return;
    const target = ctx.message?.reply_to_message?.from;
    if (!target) return ctx.reply('❌ Reply qiling.');
    const dbUser = await userService.getOrCreate(BigInt(target.id), target.first_name);
    await userService.setRole(ctx.group.id, dbUser.id, Role.MODERATOR);
    await ctx.reply(`✅ ${mention(target.id, target.first_name)} Moderator qilindi.`, { parse_mode: 'HTML' });
  });

  bot.command('demote', requireGroup, requireAdmin, async (ctx) => {
    if (!ctx.group) return;
    const target = ctx.message?.reply_to_message?.from;
    if (!target) return ctx.reply('❌ Reply qiling.');
    const dbUser = await userService.getOrCreate(BigInt(target.id), target.first_name);
    await userService.setRole(ctx.group.id, dbUser.id, Role.MEMBER);
    await ctx.reply(`✅ ${mention(target.id, target.first_name)} oddiy a'zo qilindi.`, { parse_mode: 'HTML' });
  });

  // ─── Blacklist / Whitelist ──────────────────────────────────────────────

  bot.command('blacklist', requireGroup, requireAdmin, async (ctx) => {
    if (!ctx.group) return;
    const target = ctx.message?.reply_to_message?.from;
    if (!target) return ctx.reply('❌ Reply qiling.');
    const dbUser = await userService.getOrCreate(BigInt(target.id), target.first_name);
    await userService.blacklist(ctx.group.id, dbUser.id, true);
    await ctx.reply(`⛔ ${mention(target.id, target.first_name)} qora ro'yxatga qo'shildi.`, { parse_mode: 'HTML' });
  });

  bot.command('whitelist', requireGroup, requireAdmin, async (ctx) => {
    if (!ctx.group) return;
    const target = ctx.message?.reply_to_message?.from;
    if (!target) return ctx.reply('❌ Reply qiling.');
    const dbUser = await userService.getOrCreate(BigInt(target.id), target.first_name);
    await userService.whitelist(ctx.group.id, dbUser.id, true);
    await ctx.reply(`✅ ${mention(target.id, target.first_name)} oq ro'yxatga qo'shildi.`, { parse_mode: 'HTML' });
  });
}
