import { Bot } from 'grammy';
import { BotContext } from '../../types';
import { groupService } from '../../services/group.service';
import { logService } from '../../services/log.service';
import { requireAdmin, requireGroup } from '../../middleware';
import { formatLogAction, formatDate } from '../../utils/formatters';

export function registerLoggingCommands(bot: Bot<BotContext>): void {
  // /setlogchat — reply from log group or use current chat
  bot.command('setlogchat', requireGroup, requireAdmin, async (ctx) => {
    if (!ctx.group) return;
    const origin = ctx.message?.forward_origin;
    let chatId: number = ctx.chat.id;
    if (origin?.type === 'channel') chatId = origin.chat.id;
    else if (origin?.type === 'chat') chatId = origin.sender_chat.id;
    await groupService.updateSettings(ctx.group.id, {
      logEnabled: true,
      logChatId: BigInt(chatId),
    });
    await ctx.reply(`✅ Log chat sozlandi: <code>${chatId}</code>`, { parse_mode: 'HTML' });
  });

  bot.command('logs', requireGroup, requireAdmin, async (ctx) => {
    if (!ctx.group) return;
    const logs = await logService.getRecent(ctx.group.id, 10);

    if (!logs.length) return ctx.reply('📋 Log yo\'q.');

    const text = logs
      .map(l => {
        const user = l.user ? `@${l.user.username ?? l.user.telegramId}` : 'System';
        return `• ${formatLogAction(l.action)} — ${user} — ${formatDate(l.createdAt)}`;
      })
      .join('\n');

    await ctx.reply(`📋 <b>Oxirgi 10 ta log:</b>\n\n${text}`, { parse_mode: 'HTML' });
  });
}
