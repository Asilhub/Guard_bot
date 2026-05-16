import { Bot } from 'grammy';
import { BotContext } from '../../types';
import { groupService } from '../../services/group.service';
import { requireAdmin, requireGroup } from '../../middleware';
import { antispamSettingsKeyboard } from '../../utils/keyboards';

export function registerAntispamCommands(bot: Bot<BotContext>): void {
  bot.command('antispam', requireGroup, requireAdmin, async (ctx) => {
    if (!ctx.group?.settings) return;
    const s = ctx.group.settings;
    const status = s.antispamEnabled ? '✅ Yoqilgan' : '❌ O\'chirilgan';

    await ctx.reply(`🛡 <b>Antispam sozlamalari</b>\nHolati: ${status}`, {
      parse_mode: 'HTML',
      reply_markup: antispamSettingsKeyboard(s),
    });
  });

  bot.command('antispam_on', requireGroup, requireAdmin, async (ctx) => {
    if (!ctx.group) return;
    await groupService.updateSettings(ctx.group.id, { antispamEnabled: true });
    await ctx.reply('✅ Antispam yoqildi.');
  });

  bot.command('antispam_off', requireGroup, requireAdmin, async (ctx) => {
    if (!ctx.group) return;
    await groupService.updateSettings(ctx.group.id, { antispamEnabled: false });
    await ctx.reply('❌ Antispam o\'chirildi.');
  });

  // Antispam sub-settings callbacks
  bot.callbackQuery(/^antispam:(.+)$/, requireAdmin, async (ctx) => {
    if (!ctx.group?.settings) return ctx.answerCallbackQuery();

    const field = ctx.match[1];
    const fieldMap: Record<string, string> = {
      flood: 'floodControl',
      repeat: 'antiRepeat',
      emoji: 'antiEmojiSpam',
      mention: 'antiMentionSpam',
      link: 'antiLinkSpam',
      forward: 'antiForwardSpam',
    };

    const key = fieldMap[field];
    if (!key) return ctx.answerCallbackQuery();

    const current = (ctx.group.settings as Record<string, unknown>)[key] as boolean;
    await groupService.updateSettings(ctx.group.id, { [key]: !current });

    const updated = await groupService.getByTelegramId(BigInt(ctx.chat!.id));
    if (!updated?.settings) return ctx.answerCallbackQuery();

    await ctx.editMessageReplyMarkup({ reply_markup: antispamSettingsKeyboard(updated.settings) });
    await ctx.answerCallbackQuery(!current ? '✅ Yoqildi' : '❌ O\'chirildi');
  });
}
