import { Warning, Punishment, Log, LogAction } from '@prisma/client';
import { escapeHtml, formatDuration } from './helpers';

export function formatWarnList(warnings: Warning[], username: string): string {
  if (warnings.length === 0) return `<b>${escapeHtml(username)}</b> uchun ogohlantirish yo'q.`;

  const list = warnings
    .map((w, i) => `${i + 1}. ${w.reason ? escapeHtml(w.reason) : 'Sabab ko\'rsatilmagan'} — ${formatDate(w.createdAt)}`)
    .join('\n');

  return `<b>${escapeHtml(username)}</b> ogohlantirishlari:\n\n${list}`;
}

export function formatPunishment(p: Punishment): string {
  const typeMap: Record<string, string> = {
    WARN: '⚠️ Ogohlantirish',
    MUTE: '🔇 Mute',
    TEMP_MUTE: '🔇 Vaqtinchalik Mute',
    KICK: '👢 Kick',
    BAN: '🚫 Ban',
    TEMP_BAN: '🚫 Vaqtinchalik Ban',
    DELETE: '🗑 O\'chirildi',
  };

  let text = typeMap[p.type] ?? p.type;
  if (p.duration) text += ` (${formatDuration(p.duration)})`;
  if (p.reason) text += `\nSabab: ${escapeHtml(p.reason)}`;
  return text;
}

export function formatLogAction(action: LogAction): string {
  const map: Record<LogAction, string> = {
    MESSAGE_DELETED: '🗑 Xabar o\'chirildi',
    USER_WARNED: '⚠️ Ogohlantirish berildi',
    USER_MUTED: '🔇 Mute qilindi',
    USER_TEMP_MUTED: '🔇 Vaqtinchalik mute',
    USER_KICKED: '👢 Kick qilindi',
    USER_BANNED: '🚫 Ban qilindi',
    USER_TEMP_BANNED: '🚫 Vaqtinchalik ban',
    USER_UNBANNED: '✅ Ban olib tashlandi',
    USER_UNMUTED: '✅ Mute olib tashlandi',
    WARNING_REMOVED: '✅ Ogohlantirish olib tashlandi',
    KEYWORD_ADDED: '🔑 Kalit so\'z qo\'shildi',
    KEYWORD_REMOVED: '🔑 Kalit so\'z o\'chirildi',
    SETTINGS_CHANGED: '⚙️ Sozlamalar o\'zgartirildi',
    ADMIN_ACTION: '👮 Admin harakat',
    SPAM_DETECTED: '🚨 Spam aniqlandi',
    PROTECTION_TRIGGERED: '🛡 Himoya ishga tushdi',
    RAID_DETECTED: '⚠️ Raid aniqlandi',
  };
  return map[action] ?? action;
}

export function formatDate(date: Date): string {
  return date.toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' });
}

export function formatSettingsSummary(settings: {
  antispamEnabled: boolean;
  protectionEnabled: boolean;
  cleanerEnabled: boolean;
  keywordEnabled: boolean;
  logEnabled: boolean;
  warnLimit: number;
}): string {
  const s = (v: boolean) => (v ? '✅' : '❌');
  return [
    `🤖 <b>GuardianBot V1 — Sozlamalar</b>`,
    '',
    `${s(settings.antispamEnabled)} Antispam`,
    `${s(settings.protectionEnabled)} Himoya (Porn/Scam)`,
    `${s(settings.cleanerEnabled)} Service message cleaner`,
    `${s(settings.keywordEnabled)} Kalit so'z filtri`,
    `${s(settings.logEnabled)} Logging`,
    `⚠️ Warn limiti: <b>${settings.warnLimit}</b>`,
  ].join('\n');
}
