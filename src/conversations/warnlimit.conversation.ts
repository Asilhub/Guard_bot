import { Conversation } from '@grammyjs/conversations';
import { BotContext } from '../types';
import { groupService } from '../services/group.service';

export async function setWarnLimitConversation(
  conversation: Conversation<BotContext>,
  ctx: BotContext,
): Promise<void> {
  if (!ctx.chat) return;
  const chatId = ctx.chat.id;

  await ctx.reply('⚠️ Yangi warn limiti (1-20) ni yuboring.\n<i>/cancel — bekor qilish</i>', {
    parse_mode: 'HTML',
  });

  const msg = await conversation.waitFor('message:text', {
    otherwise: (c) => c.reply('❌ Raqam yuboring yoki /cancel.'),
  });
  const text = msg.message.text.trim();

  if (text === '/cancel') {
    await ctx.api.sendMessage(chatId, '❌ Bekor qilindi.');
    return;
  }

  const n = parseInt(text, 10);
  if (!Number.isFinite(n) || n < 1 || n > 20) {
    await ctx.api.sendMessage(chatId, '❌ 1-20 oralig\'idagi raqam kerak.');
    return;
  }

  const group = await conversation.external(() => groupService.getByTelegramId(BigInt(chatId)));
  if (!group) return;

  await conversation.external(() => groupService.updateSettings(group.id, { warnLimit: n }));
  await ctx.api.sendMessage(chatId, `✅ Warn limiti ${n} ga o'rnatildi.`);
}
