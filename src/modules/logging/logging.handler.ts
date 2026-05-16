import { Bot } from 'grammy';
import { BotContext } from '../../types';
import { logService } from '../../services/log.service';
import { groupService } from '../../services/group.service';
import { formatLogAction, formatDate } from '../../utils/formatters';
import { escapeHtml } from '../../utils/helpers';
import { createModuleLogger } from '../../utils/logger';

const log = createModuleLogger('logging');

export function registerLoggingEvents(bot: Bot<BotContext>): void {
  // Intercept log events and forward to log group
  bot.use(async (ctx, next) => {
    await next();

    const settings = ctx.group?.settings;
    if (!settings?.logEnabled || !settings.logChatId) return;

    // Forward significant events to log chat
    // (actual forwarding is done via logService.sendToLogChat called from other handlers)
  });
}

export async function sendLogMessage(
  bot: Bot<BotContext>,
  groupId: string,
  text: string,
): Promise<void> {
  const group = await groupService.getById(groupId);
  const logChatId = group?.settings?.logChatId;
  if (!logChatId || !group?.settings?.logEnabled) return;

  await logService.sendToLogChat(bot, logChatId, text);
}
