import { Bot } from 'grammy';
import { BotContext } from '../../types';
import { keywordService } from '../../services/keyword.service';
import { requireAdmin, requireGroup } from '../../middleware';
import { escapeHtml } from '../../utils/helpers';

export function registerKeywordCommands(bot: Bot<BotContext>): void {
  // /addkeyword <word> [--regex] [--action mute|ban|kick|delete]
  bot.command('addkeyword', requireGroup, requireAdmin, async (ctx) => {
    if (!ctx.group || !ctx.from) return;

    const args = ctx.match?.trim();
    if (!args) {
      return ctx.reply('Ishlatish: <code>/addkeyword &lt;so\'z&gt; [--regex] [--action mute|ban|kick|delete]</code>', {
        parse_mode: 'HTML',
      });
    }

    const isRegex = args.includes('--regex');
    const actionMatch = args.match(/--action\s+(mute|ban|kick|delete)/i);
    const actionMap: Record<string, 'MUTE' | 'BAN' | 'KICK' | 'DELETE'> = {
      mute: 'MUTE',
      ban: 'BAN',
      kick: 'KICK',
      delete: 'DELETE',
    };
    const action = actionMatch ? actionMap[actionMatch[1].toLowerCase()] : 'MUTE';
    const pattern = args.replace(/--regex|--action\s+\S+/gi, '').trim();

    if (!pattern) return ctx.reply('❌ So\'z bo\'sh bo\'lishi mumkin emas.');

    const result = await keywordService.add(ctx.group.id, pattern, ctx.from.id, isRegex, action);
    if (!result) {
      return ctx.reply('❌ Noto\'g\'ri pattern yoki allaqachon mavjud.');
    }

    await ctx.reply(
      `✅ Kalit so'z qo'shildi:\n<code>${escapeHtml(pattern)}</code>${isRegex ? ' (regex)' : ''}\nAction: <b>${action}</b>`,
      { parse_mode: 'HTML' },
    );
  });

  // /removekeyword <word>
  bot.command('removekeyword', requireGroup, requireAdmin, async (ctx) => {
    if (!ctx.group) return;
    const pattern = ctx.match?.trim();
    if (!pattern) return ctx.reply('Ishlatish: <code>/removekeyword &lt;so\'z&gt;</code>', { parse_mode: 'HTML' });

    const removed = await keywordService.remove(ctx.group.id, pattern);
    await ctx.reply(removed ? `✅ <code>${escapeHtml(pattern)}</code> o'chirildi.` : '❌ So\'z topilmadi.', {
      parse_mode: 'HTML',
    });
  });

  // /keywords — list all
  bot.command('keywords', requireGroup, requireAdmin, async (ctx) => {
    if (!ctx.group) return;
    const list = await keywordService.list(ctx.group.id);

    if (!list.length) return ctx.reply('📋 Taqiqlangan so\'zlar yo\'q.');

    const text = list
      .map((k, i) => `${i + 1}. <code>${escapeHtml(k.pattern)}</code>${k.isRegex ? ' [regex]' : ''} → ${k.action}`)
      .join('\n');

    await ctx.reply(`🔑 <b>Taqiqlangan so'zlar (${list.length}):</b>\n\n${text}`, { parse_mode: 'HTML' });
  });
}
