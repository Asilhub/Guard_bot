import { prisma } from '../database/prisma';
import { cacheService } from './cache.service';
import { Keyword, PunishmentType } from '@prisma/client';

export class KeywordService {
  async add(
    groupId: string,
    pattern: string,
    addedBy: number,
    isRegex = false,
    action: PunishmentType = PunishmentType.MUTE,
  ): Promise<Keyword | null> {
    try {
      if (isRegex) new RegExp(pattern); // validate regex
      const kw = await prisma.keyword.create({
        data: { groupId, pattern, isRegex, action, addedBy: BigInt(addedBy) },
      });
      await cacheService.invalidateKeywords(groupId);
      return kw;
    } catch {
      return null;
    }
  }

  async remove(groupId: string, pattern: string): Promise<boolean> {
    const result = await prisma.keyword.deleteMany({ where: { groupId, pattern } });
    if (result.count > 0) await cacheService.invalidateKeywords(groupId);
    return result.count > 0;
  }

  async list(groupId: string): Promise<Keyword[]> {
    const cached = await cacheService.getKeywords<Keyword[]>(groupId);
    if (cached) return cached;

    const keywords = await prisma.keyword.findMany({ where: { groupId } });
    await cacheService.setKeywords(groupId, keywords);
    return keywords;
  }

  async check(groupId: string, text: string): Promise<Keyword | null> {
    const keywords = await this.list(groupId);
    const lower = text.toLowerCase();

    for (const kw of keywords) {
      if (kw.isRegex) {
        try {
          if (new RegExp(kw.pattern, 'ui').test(text)) return kw;
        } catch {
          continue;
        }
      } else {
        if (lower.includes(kw.pattern.toLowerCase())) return kw;
      }
    }
    return null;
  }
}

export const keywordService = new KeywordService();
