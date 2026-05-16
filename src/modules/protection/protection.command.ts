import { Bot } from 'grammy';
import { BotContext } from '../../types';
import { groupService } from '../../services/group.service';
import { requireAdmin, requireGroup } from '../../middleware';

export function registerProtectionCommands(bot: Bot<BotContext>): void {
  bot.command('protection_on', requireGroup, requireAdmin, async (ctx) => {
    if (!ctx.group) return;
    await groupService.updateSettings(ctx.group.id, { protectionEnabled: true });
    await ctx.reply('✅ Himoya yoqildi (Porn/Scam bloklash).');
  });

  bot.command('protection_off', requireGroup, requireAdmin, async (ctx) => {
    if (!ctx.group) return;
    await groupService.updateSettings(ctx.group.id, { protectionEnabled: false });
    await ctx.reply('❌ Himoya o\'chirildi.');
  });

  bot.command('antiraid_on', requireGroup, requireAdmin, async (ctx) => {
    if (!ctx.group) return;
    await groupService.updateSettings(ctx.group.id, { antiRaidEnabled: true });
    await ctx.reply('✅ Anti-Raid yoqildi.');
  });

  bot.command('antiraid_off', requireGroup, requireAdmin, async (ctx) => {
    if (!ctx.group) return;
    await groupService.updateSettings(ctx.group.id, { antiRaidEnabled: false });
    await ctx.reply('❌ Anti-Raid o\'chirildi.');
  });

  bot.command('silent_on', requireGroup, requireAdmin, async (ctx) => {
    if (!ctx.group) return;
    await groupService.updateSettings(ctx.group.id, { silentMode: true });
    await ctx.reply('🔇 Silent mode yoqildi — bot xabar yubormaydi.');
  });

  bot.command('silent_off', requireGroup, requireAdmin, async (ctx) => {
    if (!ctx.group) return;
    await groupService.updateSettings(ctx.group.id, { silentMode: false });
    await ctx.reply('🔊 Silent mode o\'chirildi.');
  });
}
