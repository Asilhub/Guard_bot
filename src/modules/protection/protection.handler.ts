import { Bot } from 'grammy';
import { BotContext } from '../../types';
import { protectionService } from '../../services/protection.service';
import { punishmentService } from '../../services/punishment.service';
import { userService } from '../../services/user.service';
import { logService } from '../../services/log.service';
import { cacheService } from '../../services/cache.service';
import { LogAction } from '@prisma/client';
import { mention } from '../../utils/helpers';
import { createModuleLogger } from '../../utils/logger';

const log = createModuleLogger('protection');

export function registerProtectionEvents(bot: Bot<BotContext>): void {
  // Check new members for porn/scam accounts
  bot.on('message:new_chat_members', async (ctx, next) => {
    const settings = ctx.group?.settings;
    if (!settings?.protectionEnabled || !ctx.group) return next();

    for (const newMember of ctx.message.new_chat_members) {
      if (newMember.is_bot) continue;

      // Raid detection
      if (settings.antiRaidEnabled) {
        const raidCount = await cacheService.incrementRaid(BigInt(ctx.chat.id), settings.antiRaidWindowSec);
        if (raidCount >= settings.antiRaidThreshold) {
          log.warn(`Raid detected in group ${ctx.chat.id}`);
          await logService.log(ctx.group.id, LogAction.RAID_DETECTED, undefined, {
            count: raidCount,
          });
          await bot.api.banChatMember(ctx.chat.id, newMember.id);
          if (!settings.silentMode) {
            await ctx.reply('⚠️ <b>Anti-Raid:</b> Shubhali faollik aniqlandi, foydalanuvchi ban qilindi.', {
              parse_mode: 'HTML',
            });
          }
          continue;
        }
      }

      const check = protectionService.checkAccount(newMember);
      if (!check.isSuspicious) {
        // Restrict new user temporarily if enabled
        if (settings.restrictNewUsers) {
          const dbUser = await userService.getOrCreate(BigInt(newMember.id), newMember.first_name);
          await cacheService.markNewUser(BigInt(ctx.chat.id), newMember.id, settings.newUserRestrictSec);
          await bot.api.restrictChatMember(
            ctx.chat.id,
            newMember.id,
            { can_send_messages: false },
            { until_date: Math.floor(Date.now() / 1000) + settings.newUserRestrictSec },
          );
        }
        continue;
      }

      log.info(`Suspicious account detected: ${newMember.id} — ${check.reason}`);

      const dbUser = await userService.getOrCreate(BigInt(newMember.id), newMember.first_name);

      await punishmentService.apply(bot, {
        groupId: ctx.group.id,
        userId: dbUser.id,
        telegramGroupId: BigInt(ctx.chat.id),
        telegramUserId: newMember.id,
        reason: check.reason,
        issuedBy: ctx.me.id,
      }, settings.protectionAction);

      await logService.log(ctx.group.id, LogAction.PROTECTION_TRIGGERED, dbUser.id, {
        reason: check.reason,
        confidence: check.confidence,
      });

      if (!settings.silentMode) {
        await ctx.reply(
          `🛡 ${mention(newMember.id, newMember.first_name)} shubhali akkaunt sifatida aniqlandi va ${settings.protectionAction} qilindi.\nSabab: ${check.reason}`,
          { parse_mode: 'HTML' },
        );
      }
    }

    return next();
  });

  // Check message content for NSFW/scam
  bot.on('message:text', async (ctx, next) => {
    const settings = ctx.group?.settings;
    if (!settings?.protectionEnabled || !settings.filterNsfw || !ctx.group || !ctx.from || ctx.from.is_bot) return next();

    const dbUser = ctx.dbUser;
    if (!dbUser) return next();

    const isWhitelisted = await userService.isWhitelisted(ctx.group.id, dbUser.id);
    if (isWhitelisted) return next();

    const check = protectionService.checkMessageContent(ctx.message.text);
    if (!check.isSuspicious) return next();

    try { await ctx.deleteMessage(); } catch {}

    await logService.log(ctx.group.id, LogAction.PROTECTION_TRIGGERED, dbUser.id, {
      reason: check.reason,
    });

    await punishmentService.apply(bot, {
      groupId: ctx.group.id,
      userId: dbUser.id,
      telegramGroupId: BigInt(ctx.chat.id),
      telegramUserId: ctx.from.id,
      reason: check.reason,
      issuedBy: ctx.me.id,
    }, settings.protectionAction);

    if (!settings.silentMode) {
      const msg = await ctx.reply(
        `🛡 ${mention(ctx.from.id, ctx.from.first_name)} — ${check.reason}`,
        { parse_mode: 'HTML' },
      );
      setTimeout(() => ctx.api.deleteMessage(ctx.chat.id, msg.message_id).catch(() => {}), 6000);
    }
  });
}
