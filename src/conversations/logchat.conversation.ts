import { Conversation } from '@grammyjs/conversations';
import { BotContext } from '../types';
import { groupService } from '../services/group.service';

export async function setLogChatConversation(
  conversation: Conversation<BotContext>,
  ctx: BotContext,
): Promise<void> {
  if (!ctx.chat) return;
  const chatId = ctx.chat.id;

  await ctx.reply(
    '📊 <b>Log chat</b>\n\nLoglar yuboriladigan chatdan istalgan xabarni shu yerga <b>forward</b> qiling.\n<i>/cancel — bekor qilish</i>',
    { parse_mode: 'HTML' },
  );

  const msg = await conversation.waitFor('message', {
    otherwise: (c) => c.reply('❌ Forward qiling yoki /cancel.'),
  });

  if ('text' in msg.message && msg.message.text === '/cancel') {
    await ctx.api.sendMessage(chatId, '❌ Bekor qilindi.');
    return;
  }

  const origin = msg.message.forward_origin;
  let targetChatId: number | null = null;
  if (origin?.type === 'channel') targetChatId = origin.chat.id;
  else if (origin?.type === 'chat') targetChatId = origin.sender_chat.id;

  if (!targetChatId) {
    await ctx.api.sendMessage(chatId, '❌ Bu forward emas. Bekor qilindi.');
    return;
  }

  const group = await conversation.external(() => groupService.getByTelegramId(BigInt(chatId)));
  if (!group) return;

  await conversation.external(() =>
    groupService.updateSettings(group.id, { logEnabled: true, logChatId: BigInt(targetChatId!) }),
  );

  await ctx.api.sendMessage(chatId, `✅ Log chat sozlandi: <code>${targetChatId}</code>`, {
    parse_mode: 'HTML',
  });
}
