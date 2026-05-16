import { User as TgUser } from 'grammy/types';
import { AccountCheckResult } from '../types';

const PORN_PATTERNS = [
  /\b(sex|porn|xxx|nude|naked|onlyfans|18\+|adult)\b/i,
  /\b(escort|cam\s*girl|sugar\s*baby|nudes?|leaks?)\b/i,
  /profilimga\s+kiring/i,
  /\bintim\b/i,
];

const SCAM_PATTERNS = [
  /\b(free\s+money|earn\s+\$|guaranteed\s+profit|investment\s+returns?)\b/i,
  /\b(click\s+here\s+to\s+win|you\s+(?:have\s+)?won)\b/i,
  /\b(crypto\s+signal|forex\s+signal|pump\s+group)\b/i,
  /\b(admin|support|official)\s*(?:bot|account)?\s*🔑/i,
];

const FAKE_CRYPTO_PATTERNS = [
  /\b(100x|1000x)\s+(?:gain|profit|return)/i,
  /\b(?:btc|eth|usdt|ton)\s+(?:giveaway|airdrop|free)/i,
  /send\s+\d+\s+(?:btc|eth|usdt)/i,
];

export class ProtectionService {
  checkAccount(user: TgUser): AccountCheckResult {
    const text = [
      user.first_name ?? '',
      user.last_name ?? '',
      user.username ?? '',
    ].join(' ');

    for (const pattern of PORN_PATTERNS) {
      if (pattern.test(text)) {
        return { isSuspicious: true, reason: 'Porn/adult content account', confidence: 90 };
      }
    }

    for (const pattern of SCAM_PATTERNS) {
      if (pattern.test(text)) {
        return { isSuspicious: true, reason: 'Scam account', confidence: 85 };
      }
    }

    for (const pattern of FAKE_CRYPTO_PATTERNS) {
      if (pattern.test(text)) {
        return { isSuspicious: true, reason: 'Fake crypto account', confidence: 80 };
      }
    }

    return { isSuspicious: false, confidence: 0 };
  }

  checkMessageContent(text: string): AccountCheckResult {
    for (const pattern of PORN_PATTERNS) {
      if (pattern.test(text)) {
        return { isSuspicious: true, reason: 'Porn/NSFW content', confidence: 95 };
      }
    }

    for (const pattern of SCAM_PATTERNS) {
      if (pattern.test(text)) {
        return { isSuspicious: true, reason: 'Scam content', confidence: 88 };
      }
    }

    for (const pattern of FAKE_CRYPTO_PATTERNS) {
      if (pattern.test(text)) {
        return { isSuspicious: true, reason: 'Crypto scam content', confidence: 85 };
      }
    }

    return { isSuspicious: false, confidence: 0 };
  }
}

export const protectionService = new ProtectionService();
