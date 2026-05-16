import { createBot } from './bot';
import { connectDatabase, disconnectDatabase } from './database/prisma';
import { connectRedis, disconnectRedis } from './database/redis';
import { logger } from './utils/logger';
import { config } from './configs';

async function main(): Promise<void> {
  logger.info('GuardianBot V1 starting...');

  await connectDatabase();
  await connectRedis();

  const bot = createBot();

  // Set bot commands for Telegram menu
  await bot.api.setMyCommands([
    { command: 'start', description: 'Botni ishga tushirish' },
    { command: 'help', description: 'Yordam' },
    { command: 'settings', description: 'Sozlamalar paneli' },
    { command: 'cleaner', description: 'Cleaner sozlamalari' },
    { command: 'antispam', description: 'Antispam sozlamalari' },
    { command: 'keywords', description: 'Kalit so\'zlar ro\'yxati' },
    { command: 'addkeyword', description: 'Kalit so\'z qo\'shish' },
    { command: 'removekeyword', description: 'Kalit so\'z o\'chirish' },
    { command: 'warn', description: 'Foydalanuvchiga ogohlantirish' },
    { command: 'unwarn', description: 'Ogohlantirish olib tashlash' },
    { command: 'warns', description: 'Ogohlantirishlar ro\'yxati' },
    { command: 'ban', description: 'Foydalanuvchini ban qilish' },
    { command: 'unban', description: 'Foydalanuvchini ban olib tashlash' },
    { command: 'kick', description: 'Foydalanuvchini kick qilish' },
    { command: 'mute', description: 'Foydalanuvchini mute qilish' },
    { command: 'unmute', description: 'Foydalanuvchini mute olib tashlash' },
    { command: 'logs', description: 'Oxirgi loglar' },
    { command: 'rules', description: 'Guruh qoidalari' },
  ]);

  // Graceful shutdown
  process.once('SIGINT', () => shutdown(bot));
  process.once('SIGTERM', () => shutdown(bot));

  if (config.webhook.url) {
    logger.info(`Starting in webhook mode: ${config.webhook.url}`);
    await bot.api.setWebhook(`${config.webhook.url}/bot${config.bot.token}`, {
      secret_token: config.webhook.secret,
    });
    // You can add express/fastify webhook server here for production
  } else {
    logger.info('Starting in polling mode...');
    await bot.start({
      onStart: (botInfo) => {
        logger.info(`GuardianBot V1 started as @${botInfo.username}`);
      },
    });
  }
}

async function shutdown(bot: ReturnType<typeof createBot>): Promise<void> {
  logger.info('Shutting down...');
  await bot.stop();
  await disconnectDatabase();
  await disconnectRedis();
  process.exit(0);
}

main().catch((err) => {
  logger.error('Fatal error:', err);
  process.exit(1);
});
