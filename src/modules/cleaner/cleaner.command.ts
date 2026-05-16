import { Bot } from 'grammy';
import { BotContext } from '../../types';
import { groupService } from '../../services/group.service';
import { requireAdmin, requireGroup } from '../../middleware';
import { cleanerSettingsKeyboard } from '../../utils/keyboards';

export function registerCleanerCommands(bot: Bot<BotContext>): void {
  bot.command('cleaner_on', requireGroup, requireAdmin, async (ctx) => {
    if (!ctx.group) return;
    await groupService.updateSettings(ctx.group.id, { cleanerEnabled: true });
    await ctx.reply('✅ Cleaner yoqildi.', { reply_to_message_id: ctx.message?.message_id });
  });

  bot.command('cleaner_off', requireGroup, requireAdmin, async (ctx) => {
    if (!ctx.group) return;
    await groupService.updateSettings(ctx.group.id, { cleanerEnabled: false });
    await ctx.reply('❌ Cleaner o\'chirildi.', { reply_to_message_id: ctx.message?.message_id });
  });

  bot.command('cleaner', requireGroup, requireAdmin, async (ctx) => {
    if (!ctx.group?.settings) return;
    const status = ctx.group.settings.cleanerEnabled ? '✅ Yoqilgan' : '❌ O\'chirilgan';
    await ctx.reply(`🧹 <b>Cleaner sozlamalari</b>\nHolati: ${status}`, {
      parse_mode: 'HTML',
      reply_markup: cleanerSettingsKeyboard(ctx.group.settings),
    });
  });

  // Callback handlers for cleaner settings
  bot.callbackQuery(/^cleaner:(.+)$/, requireAdmin, async (ctx) => {
    if (!ctx.group?.settings) return ctx.answerCallbackQuery();

    const field = ctx.match[1];
    const fieldMap: Record<string, keyof typeof ctx.group.settings> = {
      join: 'cleanJoin',
      leave: 'cleanLeave',
      photo: 'cleanPhotoChange',
      pinned: 'cleanPinnedMessage',
      title: 'cleanTitleChange',
    };

    const settingsField = fieldMap[field];
    if (!settingsField) return ctx.answerCallbackQuery('Noto\'g\'ri sozlama');

    const current = ctx.group.settings[settingsField] as boolean;
    await groupService.updateSettings(ctx.group.id, { [settingsField]: !current });

    const updated = await groupService.getByTelegramId(BigInt(ctx.chat!.id));
    if (!updated?.settings) return ctx.answerCallbackQuery();

    await ctx.editMessageReplyMarkup({
      reply_markup: cleanerSettingsKeyboard(updated.settings),
    });
    await ctx.answerCallbackQuery(`${!current ? '✅ Yoqildi' : '❌ O\'chirildi'}`);
  });
}
