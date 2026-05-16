import { Conversation } from '@grammyjs/conversations';
import { BotContext } from '../types';
import { groupService } from '../services/group.service';

export async function setRulesConversation(
  conversation: Conversation<BotContext>,
  ctx: BotContext,
): Promise<void> {
  if (!ctx.chat) return;
  const chatId = ctx.chat.id;

  await ctx.reply(
    '📋 <b>Guruh qoidalari matni</b>\n\nQoidalar matnini yuboring.\n<i>/cancel — bekor qilish</i>',
    { parse_mode: 'HTML' },
  );

  const msg = await conversation.waitFor('message:text', {
    otherwise: (c) => c.reply('❌ Matn yuboring yoki /cancel.'),
  });
  const text = msg.message.text.trim();

  if (text === '/cancel') {
    await ctx.api.sendMessage(chatId, '❌ Bekor qilindi.');
    return;
  }

  const group = await conversation.external(() => groupService.getByTelegramId(BigInt(chatId)));
  if (!group) return;

  await conversation.external(() =>
    groupService.updateSettings(group.id, { rulesEnabled: true, rulesText: text }),
  );

  await ctx.api.sendMessage(chatId, '✅ Qoidalar saqlandi.');
}
