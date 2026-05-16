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
    { command: 'menu', description: '🎛 Boshqaruv paneli' },
    { command: 'actions', description: '🛡 Reply qilingan foydalanuvchi ustida amallar' },
    { command: 'rules', description: '📋 Guruh qoidalari' },
    { command: 'help', description: '❓ Yordam' },
    { command: 'start', description: '🚀 Botni ishga tushirish' },
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
