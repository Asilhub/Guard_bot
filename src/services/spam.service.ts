import { Message } from 'grammy/types';
import { GroupSettings } from '@prisma/client';
import { cacheService } from './cache.service';
import { SpamCheckResult } from '../types';
import { countEmojis, countMentions, extractLinks } from '../utils/helpers';

const TELEGRAM_INVITE_REGEX = /t\.me\/(?:joinchat\/|\+)[a-zA-Z0-9_-]+/i;
const CRYPTO_SCAM_REGEX = /(?:free\s+(?:btc|eth|usdt|crypto)|(?:100x|1000x)\s+profit|guaranteed\s+returns?|doubl(?:e|ing)\s+(?:your\s+)?(?:money|btc|crypto))/i;

export class SpamService {
  async check(
    message: Message,
    settings: GroupSettings,
    groupTelegramId: bigint,
  ): Promise<SpamCheckResult> {
    const userId = message.from?.id;
    if (!userId) return { isSpam: false, score: 0 };

    const text = message.text ?? message.caption ?? '';

    // ─── Flood control ────────────────────────────────────────────────────
    if (settings.floodControl) {
      const count = await cacheService.incrementFlood(
        groupTelegramId,
        userId,
        settings.floodWindowSeconds * 1000,
      );
      if (count > settings.floodMaxMessages) {
        return { isSpam: true, reason: 'Flood aniqlandi', score: 10 };
      }
    }

    // ─── Forward spam ─────────────────────────────────────────────────────
    if (settings.antiForwardSpam && message.forward_origin) {
      return { isSpam: true, reason: 'Forward spam', score: 7 };
    }

    if (!text) return { isSpam: false, score: 0 };

    // ─── Repeat messages ──────────────────────────────────────────────────
    if (settings.antiRepeat) {
      const last = await cacheService.getLastMessage(groupTelegramId, userId);
      if (last && last === text) {
        return { isSpam: true, reason: 'Takrorlangan xabar', score: 6 };
      }
      await cacheService.setLastMessage(groupTelegramId, userId, text);
    }

    // ─── Emoji spam ───────────────────────────────────────────────────────
    if (settings.antiEmojiSpam) {
      const emojiCount = countEmojis(text);
      if (emojiCount > settings.maxEmojiCount) {
        return { isSpam: true, reason: `Juda ko'p emoji (${emojiCount})`, score: 5 };
      }
    }

    // ─── Mention spam ─────────────────────────────────────────────────────
    if (settings.antiMentionSpam) {
      const mentionCount = countMentions(text) + (message.entities?.filter(e => e.type === 'text_mention').length ?? 0);
      if (mentionCount > settings.maxMentions) {
        return { isSpam: true, reason: `Ko'p mention (${mentionCount})`, score: 6 };
      }
    }

    // ─── Link spam ────────────────────────────────────────────────────────
    if (settings.antiLinkSpam) {
      const links = extractLinks(text);
      const hasEntities = message.entities?.some(e => ['url', 'text_link'].includes(e.type));
      if (links.length > 2 || hasEntities) {
        if (TELEGRAM_INVITE_REGEX.test(text)) {
          return { isSpam: true, reason: 'Telegram invite link', score: 8 };
        }
        if (links.length > 3) {
          return { isSpam: true, reason: 'Ko\'p link', score: 6 };
        }
      }
    }

    // ─── Crypto scam ──────────────────────────────────────────────────────
    if (CRYPTO_SCAM_REGEX.test(text)) {
      return { isSpam: true, reason: 'Crypto scam content', score: 9 };
    }

    return { isSpam: false, score: 0 };
  }
}

export const spamService = new SpamService();
