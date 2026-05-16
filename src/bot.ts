import { Bot, session } from 'grammy';
import { parseMode } from '@grammyjs/parse-mode';
import { hydrate } from '@grammyjs/hydrate';
import { BotContext, SessionData } from './types';
import { config } from './configs';
import { logger } from './utils/logger';

// Middleware
import {
  groupMiddleware,
  loggingMiddleware,
  rateLimitMiddleware,
} from './middleware';

// Module handlers
import { registerCleanerEvents } from './modules/cleaner/cleaner.handler';
import { registerCleanerCommands } from './modules/cleaner/cleaner.command';
import { registerKeywordEvents } from './modules/keyword-blocker/keyword.handler';
import { registerKeywordCommands } from './modules/keyword-blocker/keyword.command';
import { registerAntispamEvents } from './modules/antispam/antispam.handler';
import { registerAntispamCommands } from './modules/antispam/antispam.command';
import { registerProtectionEvents } from './modules/protection/protection.handler';
import { registerProtectionCommands } from './modules/protection/protection.command';
import { registerWarnsCommands } from './modules/warns/warns.command';
import { registerAdminCommands } from './modules/admin/admin.command';
import { registerModerationEvents } from './modules/moderation/moderation.handler';
import { registerLoggingEvents } from './modules/logging/logging.handler';
import { registerLoggingCommands } from './modules/logging/logging.command';
import { registerStartCommand } from './commands/start.command';
import { loadPlugins } from './plugins';

export function createBot(): Bot<BotContext> {
  const bot = new Bot<BotContext>(config.bot.token);

  // ─── Grammy plugins ────────────────────────────────────────────────────
  bot.use(hydrate());
  bot.api.config.use(parseMode('HTML'));

  bot.use(
    session<SessionData, BotContext>({
      initial: () => ({}),
    }),
  );

  // ─── Custom middleware (order matters) ────────────────────────────────
  bot.use(loggingMiddleware);
  bot.use(rateLimitMiddleware);
  bot.use(groupMiddleware);

  // ─── Event handlers (run first, in priority order) ───────────────────
  registerCleanerEvents(bot);        // 1. Clean service messages
  registerProtectionEvents(bot);     // 2. Block porn/scam accounts
  registerAntispamEvents(bot);       // 3. Antispam
  registerKeywordEvents(bot);        // 4. Keyword blocker
  registerModerationEvents(bot);     // 5. General moderation
  registerLoggingEvents(bot);        // 6. Logging

  // ─── Commands ─────────────────────────────────────────────────────────
  registerStartCommand(bot);
  registerCleanerCommands(bot);
  registerKeywordCommands(bot);
  registerAntispamCommands(bot);
  registerProtectionCommands(bot);
  registerWarnsCommands(bot);
  registerAdminCommands(bot);
  registerLoggingCommands(bot);

  // ─── Plugins ──────────────────────────────────────────────────────────
  loadPlugins(bot);

  // ─── Error handler ────────────────────────────────────────────────────
  bot.catch((err) => {
    const ctx = err.ctx;
    logger.error(`Bot error in update ${ctx.update.update_id}:`, err.error);
  });

  return bot;
}
