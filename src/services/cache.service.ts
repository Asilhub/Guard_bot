import { redis } from '../database/redis';

const TTL = {
  GROUP: 300,       // 5 min
  SETTINGS: 300,
  USER: 600,        // 10 min
  KEYWORDS: 600,
  MEMBER: 120,      // 2 min
};

export class CacheService {
  private prefix: string;

  constructor(prefix = 'guardian') {
    this.prefix = prefix;
  }

  private key(...parts: (string | number)[]): string {
    return `${this.prefix}:${parts.join(':')}`;
  }

  async get<T>(k: string): Promise<T | null> {
    const raw = await redis.get(k);
    if (!raw) return null;
    return JSON.parse(raw, (_key, val) =>
      typeof val === 'string' && /^-?\d+n$/.test(val) ? BigInt(val.slice(0, -1)) : val,
    ) as T;
  }

  async set(k: string, value: unknown, ttl: number): Promise<void> {
    const serialized = JSON.stringify(value, (_key, val) =>
      typeof val === 'bigint' ? `${val.toString()}n` : val,
    );
    await redis.setex(k, ttl, serialized);
  }

  async del(k: string): Promise<void> {
    await redis.del(k);
  }

  async delPattern(pattern: string): Promise<void> {
    const keys = await redis.keys(pattern);
    if (keys.length) await redis.del(...keys);
  }

  // ─── Group ────────────────────────────────────────────────────────────────

  groupKey(telegramId: bigint | number) {
    return this.key('group', telegramId.toString());
  }

  async getGroup<T>(telegramId: bigint | number): Promise<T | null> {
    return this.get<T>(this.groupKey(telegramId));
  }

  async setGroup(telegramId: bigint | number, data: unknown): Promise<void> {
    await this.set(this.groupKey(telegramId), data, TTL.GROUP);
  }

  async invalidateGroup(telegramId: bigint | number): Promise<void> {
    await this.del(this.groupKey(telegramId));
  }

  // ─── Keywords ─────────────────────────────────────────────────────────────

  keywordsKey(groupId: string) {
    return this.key('keywords', groupId);
  }

  async getKeywords<T>(groupId: string): Promise<T | null> {
    return this.get<T>(this.keywordsKey(groupId));
  }

  async setKeywords(groupId: string, data: unknown): Promise<void> {
    await this.set(this.keywordsKey(groupId), data, TTL.KEYWORDS);
  }

  async invalidateKeywords(groupId: string): Promise<void> {
    await this.del(this.keywordsKey(groupId));
  }

  // ─── Flood tracking ───────────────────────────────────────────────────────

  floodKey(groupId: number | bigint, userId: number) {
    return this.key('flood', groupId.toString(), userId);
  }

  async incrementFlood(groupId: number | bigint, userId: number, windowMs: number): Promise<number> {
    const k = this.floodKey(groupId, userId);
    const count = await redis.incr(k);
    if (count === 1) await redis.pexpire(k, windowMs);
    return count;
  }

  async resetFlood(groupId: number | bigint, userId: number): Promise<void> {
    await this.del(this.floodKey(groupId, userId));
  }

  // ─── Repeat message tracking ──────────────────────────────────────────────

  repeatKey(groupId: number | bigint, userId: number) {
    return this.key('repeat', groupId.toString(), userId);
  }

  async getLastMessage(groupId: number | bigint, userId: number): Promise<string | null> {
    return redis.get(this.repeatKey(groupId, userId));
  }

  async setLastMessage(groupId: number | bigint, userId: number, text: string): Promise<void> {
    await redis.setex(this.repeatKey(groupId, userId), 60, text);
  }

  // ─── New user restriction ─────────────────────────────────────────────────

  newUserKey(groupId: number | bigint, userId: number) {
    return this.key('newuser', groupId.toString(), userId);
  }

  async markNewUser(groupId: number | bigint, userId: number, ttlSec: number): Promise<void> {
    await redis.setex(this.newUserKey(groupId, userId), ttlSec, '1');
  }

  async isNewUser(groupId: number | bigint, userId: number): Promise<boolean> {
    return (await redis.exists(this.newUserKey(groupId, userId))) === 1;
  }

  // ─── Raid detection ───────────────────────────────────────────────────────

  raidKey(groupId: number | bigint) {
    return this.key('raid', groupId.toString());
  }

  async incrementRaid(groupId: number | bigint, windowSec: number): Promise<number> {
    const k = this.raidKey(groupId);
    const count = await redis.incr(k);
    if (count === 1) await redis.expire(k, windowSec);
    return count;
  }
}

export const cacheService = new CacheService();
