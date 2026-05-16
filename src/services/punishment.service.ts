import { Bot } from 'grammy';
import { BotContext } from '../types';
import { prisma } from '../database/prisma';
import { PunishmentType } from '@prisma/client';
import { PunishmentOptions } from '../types';
import { logService } from './log.service';
import { LogAction } from '@prisma/client';
import { logger } from '../utils/logger';

export class PunishmentService {
  async apply(bot: Bot<BotContext>, opts: PunishmentOptions, type: PunishmentType, duration?: number): Promise<boolean> {
    const {
      groupId,
      userId,
      telegramGroupId,
      telegramUserId,
      reason,
      issuedBy,
    } = opts;

    try {
      const expiresAt = duration ? new Date(Date.now() + duration * 60 * 1000) : undefined;

      await prisma.punishment.create({
        data: {
          groupId,
          userId,
          type,
          reason,
          issuedBy: BigInt(issuedBy),
          duration,
          expiresAt,
        },
      });

      switch (type) {
        case PunishmentType.MUTE:
          await bot.api.restrictChatMember(
            Number(telegramGroupId),
            telegramUserId,
            { can_send_messages: false },
          );
          await logService.log(groupId, LogAction.USER_MUTED, userId, { reason });
          break;

        case PunishmentType.TEMP_MUTE:
          await bot.api.restrictChatMember(
            Number(telegramGroupId),
            telegramUserId,
            { can_send_messages: false },
            { until_date: Math.floor((expiresAt?.getTime() ?? 0) / 1000) },
          );
          await logService.log(groupId, LogAction.USER_TEMP_MUTED, userId, { reason, duration });
          break;

        case PunishmentType.KICK:
          await bot.api.banChatMember(Number(telegramGroupId), telegramUserId);
          await bot.api.unbanChatMember(Number(telegramGroupId), telegramUserId);
          await logService.log(groupId, LogAction.USER_KICKED, userId, { reason });
          break;

        case PunishmentType.BAN:
          await bot.api.banChatMember(Number(telegramGroupId), telegramUserId);
          await logService.log(groupId, LogAction.USER_BANNED, userId, { reason });
          break;

        case PunishmentType.TEMP_BAN:
          await bot.api.banChatMember(Number(telegramGroupId), telegramUserId, {
            until_date: Math.floor((expiresAt?.getTime() ?? 0) / 1000),
          });
          await logService.log(groupId, LogAction.USER_TEMP_BANNED, userId, { reason, duration });
          break;

        case PunishmentType.DELETE:
          break;
      }

      return true;
    } catch (err) {
      logger.error('Punishment failed', { type, telegramUserId, err });
      return false;
    }
  }

  async unban(bot: Bot<BotContext>, telegramGroupId: bigint, telegramUserId: number, groupId: string, userId: string): Promise<void> {
    await bot.api.unbanChatMember(Number(telegramGroupId), telegramUserId);
    await prisma.punishment.updateMany({
      where: { groupId, userId, type: { in: [PunishmentType.BAN, PunishmentType.TEMP_BAN] }, isActive: true },
      data: { isActive: false },
    });
    await logService.log(groupId, LogAction.USER_UNBANNED, userId);
  }

  async unmute(bot: Bot<BotContext>, telegramGroupId: bigint, telegramUserId: number, groupId: string, userId: string): Promise<void> {
    await bot.api.restrictChatMember(Number(telegramGroupId), telegramUserId, {
      can_send_messages: true,
      can_send_audios: true,
      can_send_documents: true,
      can_send_photos: true,
      can_send_videos: true,
      can_send_video_notes: true,
      can_send_voice_notes: true,
      can_send_polls: true,
      can_send_other_messages: true,
      can_add_web_page_previews: true,
    });
    await prisma.punishment.updateMany({
      where: { groupId, userId, type: { in: [PunishmentType.MUTE, PunishmentType.TEMP_MUTE] }, isActive: true },
      data: { isActive: false },
    });
    await logService.log(groupId, LogAction.USER_UNMUTED, userId);
  }
}

export const punishmentService = new PunishmentService();
