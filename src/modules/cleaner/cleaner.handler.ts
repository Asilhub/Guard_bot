import { Bot } from 'grammy';
import { BotContext } from '../../types';
import { createModuleLogger } from '../../utils/logger';

const log = createModuleLogger('cleaner');

const SERVICE_MESSAGE_TYPES = [
  'new_chat_members',
  'left_chat_member',
  'new_chat_title',
  'new_chat_photo',
  'delete_chat_photo',
  'pinned_message',
] as const;

export function registerCleanerEvents(bot: Bot<BotContext>): void {
  bot.on('message', async (ctx, next) => {
    const settings = ctx.group?.settings;
    if (!settings?.cleanerEnabled) return next();

    const msg = ctx.message;

    try {
      if (settings.cleanJoin && msg.new_chat_members) {
        await ctx.deleteMessage();
        return;
      }
      if (settings.cleanLeave && msg.left_chat_member) {
        await ctx.deleteMessage();
        return;
      }
      if (settings.cleanTitleChange && msg.new_chat_title) {
        await ctx.deleteMessage();
        return;
      }
      if (settings.cleanPhotoChange && (msg.new_chat_photo || msg.delete_chat_photo)) {
        await ctx.deleteMessage();
        return;
      }
      if (settings.cleanPinnedMessage && msg.pinned_message) {
        await ctx.deleteMessage();
        return;
      }
    } catch (err) {
      log.warn('Cleaner delete failed', err);
    }

    return next();
  });
}
