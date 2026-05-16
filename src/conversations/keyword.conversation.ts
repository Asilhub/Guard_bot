import { InlineKeyboard } from 'grammy';
import { Conversation } from '@grammyjs/conversations';
import { BotContext } from '../types';
import { keywordService } from '../services/keyword.service';
import { groupService } from '../services/group.service';
import { escapeHtml } from '../utils/helpers';
import { PunishmentType } from '@prisma/client';

const ACTION_KB = new InlineKeyboard()
  .text('🗑 DELETE', 'kwact:DELETE')
  .text('🔇 MUTE', 'kwact:MUTE')
  .row()
  .text('👢 KICK', 'kwact:KICK')
  .text('🚫 BAN', 'kwact:BAN')
  .row()
  .text('❌ Bekor qilish', 'kwact:cancel');

export async function addKeywordConversation(
  conversation: Conversation<BotContext>,
  ctx: BotContext,
): Promise<void> {
  if (!ctx.chat) return;
  const chatId = ctx.chat.id;

  await ctx.reply(
    '➕ <b>Yangi kalit so\'z qo\'shish</b>\n\nTaqiqlanadigan so\'z yoki iborani yuboring.\n<i>(/cancel — bekor qilish)</i>',
    { parse_mode: 'HTML' },
  );

  const wordCtx = await conversation.waitFor('message:text', {
    otherwise: (c) => c.reply('❌ Iltimos, matn yuboring yoki /cancel deb yozing.'),
  });

  const pattern = wordCtx.message.text.trim();
  if (pattern === '/cancel') {
    await ctx.api.sendMessage(chatId, '❌ Bekor qilindi.');
    return;
  }

  await ctx.api.sendMessage(
    chatId,
    `So'z: <code>${escapeHtml(pattern)}</code>\n\nQaysi jazo qo'llansin?`,
    { parse_mode: 'HTML', reply_markup: ACTION_KB },
  );

  const actCtx = await conversation.waitForCallbackQuery(/^kwact:/, {
    otherwise: (c) => c.answerCallbackQuery('Tugmani bosing'),
  });
  await actCtx.answerCallbackQuery();
  const choice = actCtx.callbackQuery.data.split(':')[1];

  if (choice === 'cancel') {
    await ctx.api.sendMessage(chatId, '❌ Bekor qilindi.');
    return;
  }

  // Re-fetch group inside the conversation
  const group = await conversation.external(() => groupService.getByTelegramId(BigInt(chatId)));
  if (!group) return;

  const userId = ctx.from?.id ?? 0;
  const added = await conversation.external(() =>
    keywordService.add(group.id, pattern, userId, false, choice as PunishmentType),
  );

  await ctx.api.sendMessage(
    chatId,
    added
      ? `✅ Qo'shildi: <code>${escapeHtml(pattern)}</code> → <b>${choice}</b>`
      : '❌ Allaqachon mavjud yoki noto\'g\'ri.',
    { parse_mode: 'HTML' },
  );
}
