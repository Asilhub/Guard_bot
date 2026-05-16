import { prisma } from '../database/prisma';
import { LogAction } from '@prisma/client';

export class LogService {
  async log(groupId: string, action: LogAction, userId?: string, details?: Record<string, unknown>): Promise<void> {
    await prisma.log.create({
      data: { groupId, action, userId, details },
    });
  }

  async getRecent(groupId: string, limit = 20) {
    return prisma.log.findMany({
      where: { groupId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { user: true },
    });
  }

  async sendToLogChat(
    bot: { api: { sendMessage(chatId: number, text: string, opts?: Record<string, unknown>): Promise<unknown> } },
    logChatId: bigint,
    text: string,
  ): Promise<void> {
    try {
      await bot.api.sendMessage(Number(logChatId), text, { parse_mode: 'HTML' });
    } catch {
      // log chat unavailable — silently skip
    }
  }
}

export const logService = new LogService();
