import { BotContext } from '../types';

export function mention(userId: number, name: string): string {
  return `<a href="tg://user?id=${userId}">${escapeHtml(name)}</a>`;
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} daqiqa`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)} soat`;
  return `${Math.floor(minutes / 1440)} kun`;
}

export function parseDuration(text: string): number | null {
  const match = text.match(/^(\d+)(m|h|d)?$/i);
  if (!match) return null;
  const value = parseInt(match[1]);
  const unit = (match[2] || 'm').toLowerCase();
  const multipliers: Record<string, number> = { m: 1, h: 60, d: 1440 };
  return value * (multipliers[unit] ?? 1);
}

export function getUserName(ctx: BotContext): string {
  const user = ctx.from;
  if (!user) return 'Unknown';
  return user.first_name + (user.last_name ? ` ${user.last_name}` : '');
}

export function getDisplayName(firstName?: string | null, lastName?: string | null, username?: string | null): string {
  if (firstName) return firstName + (lastName ? ` ${lastName}` : '');
  if (username) return `@${username}`;
  return 'Unknown';
}

export function countEmojis(text: string): number {
  const emojiRegex = /\p{Emoji}/gu;
  return (text.match(emojiRegex) || []).length;
}

export function countMentions(text: string): number {
  const mentionRegex = /@\w+/g;
  return (text.match(mentionRegex) || []).length;
}

export function extractLinks(text: string): string[] {
  const urlRegex = /https?:\/\/[^\s]+/g;
  return text.match(urlRegex) || [];
}

export function isGroupContext(ctx: BotContext): boolean {
  return ctx.chat?.type === 'group' || ctx.chat?.type === 'supergroup';
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function chunk<T>(arr: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size),
  );
}
