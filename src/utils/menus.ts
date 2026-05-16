import { InlineKeyboard } from 'grammy';
import { GroupSettings, Keyword, PunishmentType } from '@prisma/client';
import { escapeHtml } from './helpers';

const on = '✅';
const off = '❌';

// ─── Page texts ─────────────────────────────────────────────────────────────

export function mainMenuText(): string {
  return [
    '🤖 <b>GuardianBot — Boshqaruv paneli</b>',
    '',
    'Quyidagi bo\'limlardan birini tanlang:',
  ].join('\n');
}

export function settingsText(s: GroupSettings): string {
  return [
    '⚙️ <b>Asosiy sozlamalar</b>',
    '',
    `${s.cleanerEnabled ? on : off} Cleaner`,
    `${s.antispamEnabled ? on : off} Antispam`,
    `${s.protectionEnabled ? on : off} Himoya (Porn/Scam)`,
    `${s.keywordEnabled ? on : off} Kalit so'z filtri`,
    `${s.logEnabled ? on : off} Logging`,
    `${s.silentMode ? '🔇' : '🔊'} Silent mode`,
  ].join('\n');
}

export function cleanerText(s: GroupSettings): string {
  return [
    '🧹 <b>Cleaner sozlamalari</b>',
    '',
    `${s.cleanerEnabled ? on : off} Cleaner umumiy`,
    `${s.cleanJoin ? on : off} Join xabari`,
    `${s.cleanLeave ? on : off} Leave xabari`,
    `${s.cleanPhotoChange ? on : off} Photo o'zgarishi`,
    `${s.cleanPinnedMessage ? on : off} Pinned xabar`,
    `${s.cleanTitleChange ? on : off} Title o'zgarishi`,
  ].join('\n');
}

export function antispamText(s: GroupSettings): string {
  return [
    '🛡 <b>Antispam sozlamalari</b>',
    '',
    `${s.antispamEnabled ? on : off} Antispam umumiy`,
    `${s.floodControl ? on : off} Flood (${s.floodMaxMessages}/${s.floodWindowSeconds}s)`,
    `${s.antiRepeat ? on : off} Takror xabar`,
    `${s.antiEmojiSpam ? on : off} Emoji spam (max ${s.maxEmojiCount})`,
    `${s.antiMentionSpam ? on : off} Mention spam (max ${s.maxMentions})`,
    `${s.antiLinkSpam ? on : off} Link spam`,
    `${s.antiForwardSpam ? on : off} Forward spam`,
  ].join('\n');
}

export function protectionText(s: GroupSettings): string {
  return [
    '🛡 <b>Himoya sozlamalari</b>',
    '',
    `${s.protectionEnabled ? on : off} Himoya umumiy`,
    `${s.antiPorn ? on : off} Anti-Porn`,
    `${s.antiScam ? on : off} Anti-Scam`,
    `${s.antiFakeCrypto ? on : off} Anti-Fake Crypto`,
    `${s.filterNsfw ? on : off} NSFW filter`,
    `${s.filterInviteLinks ? on : off} Invite link filter`,
    `${s.restrictNewUsers ? on : off} Yangi a'zolarni cheklash (${s.newUserRestrictSec}s)`,
    `${s.antiRaidEnabled ? on : off} Anti-Raid (${s.antiRaidThreshold}/${s.antiRaidWindowSec}s)`,
    '',
    `Jazo: <b>${s.protectionAction}</b>`,
  ].join('\n');
}

export function warnsText(s: GroupSettings): string {
  return [
    '⚠️ <b>Warn sozlamalari</b>',
    '',
    `Warn limiti: <b>${s.warnLimit}</b>`,
    `Limit jazosi: <b>${s.warnAction}</b>`,
    `TEMP_MUTE davomiyligi: <b>${s.warnMuteDuration} daqiqa</b>`,
  ].join('\n');
}

export function loggingText(s: GroupSettings): string {
  return [
    '📊 <b>Logging sozlamalari</b>',
    '',
    `${s.logEnabled ? on : off} Logging`,
    s.logChatId
      ? `Log chat: <code>${s.logChatId}</code>`
      : '<i>Log chat tanlanmagan</i>',
  ].join('\n');
}

export function pluginsText(s: GroupSettings): string {
  return [
    '🔌 <b>Pluginlar</b>',
    '',
    `${s.welcomeEnabled ? on : off} Welcome xabari`,
    `${s.rulesEnabled ? on : off} Qoidalar`,
    `${s.autoRulesOnJoin ? on : off} Auto qoidalar (DM)`,
    `${s.captchaEnabled ? on : off} Captcha (${s.captchaTimeout}s)`,
  ].join('\n');
}

export function keywordsText(list: Keyword[]): string {
  if (!list.length) {
    return '🔑 <b>Kalit so\'zlar</b>\n\nRo\'yxat bo\'sh. Yangi so\'z qo\'shing.';
  }
  const items = list
    .map((k, i) => `${i + 1}. <code>${escapeHtml(k.pattern)}</code>${k.isRegex ? ' [regex]' : ''} → ${k.action}`)
    .join('\n');
  return `🔑 <b>Kalit so'zlar (${list.length}):</b>\n\n${items}`;
}

export function helpText(): string {
  return [
    '❓ <b>Yordam — GuardianBot</b>',
    '',
    '<b>Asosiy buyruqlar:</b>',
    '/menu — Boshqaruv paneli',
    '/start — Botni ishga tushirish',
    '/help — Yordam',
    '',
    '<b>Moderatsiya (reply qilib):</b>',
    '/actions — Tezkor amallar tugmalari',
    '/warn /ban /kick /mute /unmute /unban',
    '',
    '<b>Maslahat:</b> Hamma sozlamalarni endi <code>/menu</code> orqali tugmalar bilan boshqarish mumkin.',
  ].join('\n');
}

// ─── Keyboards ──────────────────────────────────────────────────────────────

export function mainMenuKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text('⚙️ Sozlamalar', 'menu:settings')
    .text('🧹 Cleaner', 'menu:cleaner')
    .row()
    .text('🛡 Antispam', 'menu:antispam')
    .text('🛡 Himoya', 'menu:protection')
    .row()
    .text('🔑 Kalit so\'zlar', 'menu:keywords')
    .text('⚠️ Warn', 'menu:warns')
    .row()
    .text('📊 Logging', 'menu:logging')
    .text('🔌 Pluginlar', 'menu:plugins')
    .row()
    .text('🚫 Cheklovlar (ban/mute)', 'menu:bans')
    .row()
    .text('❓ Yordam', 'menu:help')
    .text('🗑 Yopish', 'menu:close');
}

export type RestrictionItem = {
  telegramId: bigint;
  name: string;
  reason: string | null;
  type: PunishmentType;
};

const TYPE_ICON: Record<string, string> = {
  BAN: '🚫',
  TEMP_BAN: '🚫⏱',
  MUTE: '🔇',
  TEMP_MUTE: '🔇⏱',
};

export function bansText(items: RestrictionItem[]): string {
  if (!items.length) {
    return '🚫 <b>Cheklovlar</b>\n\nAktiv ban/mute yo\'q.';
  }
  const list = items
    .map((u, i) => `${i + 1}. ${TYPE_ICON[u.type] ?? ''} <code>${u.telegramId}</code> — ${escapeHtml(u.name)}${u.reason ? ` (${escapeHtml(u.reason)})` : ''}`)
    .join('\n');
  return `🚫 <b>Aktiv cheklovlar (${items.length}):</b>\n\n${list}\n\n<i>Pastdagi tugmalar bilan olib tashlang.</i>`;
}

export function bansKeyboard(items: RestrictionItem[]): InlineKeyboard {
  const kb = new InlineKeyboard();
  items.slice(0, 25).forEach((u) => {
    const isMute = u.type === 'MUTE' || u.type === 'TEMP_MUTE';
    const verb = isMute ? 'Unmute' : 'Unban';
    const cb = isMute ? `unmuteu:${u.telegramId}` : `unban:${u.telegramId}`;
    const label = u.name.length > 22 ? u.name.slice(0, 19) + '...' : u.name;
    kb.text(`✅ ${verb} ${label}`, cb).row();
  });
  kb.text('⬅️ Bosh menyu', 'menu:main');
  return kb;
}

export function backKeyboard(target = 'menu:main'): InlineKeyboard {
  return new InlineKeyboard().text('⬅️ Orqaga', target);
}

export function settingsKeyboardV2(s: GroupSettings): InlineKeyboard {
  return new InlineKeyboard()
    .text(`${s.cleanerEnabled ? on : off} Cleaner`, 'toggle:cleanerEnabled')
    .text(`${s.antispamEnabled ? on : off} Antispam`, 'toggle:antispamEnabled')
    .row()
    .text(`${s.protectionEnabled ? on : off} Himoya`, 'toggle:protectionEnabled')
    .text(`${s.keywordEnabled ? on : off} Keywords`, 'toggle:keywordEnabled')
    .row()
    .text(`${s.logEnabled ? on : off} Logging`, 'toggle:logEnabled')
    .text(`${s.silentMode ? '🔇' : '🔊'} Silent`, 'toggle:silentMode')
    .row()
    .text('⬅️ Bosh menyu', 'menu:main');
}

export function cleanerKeyboardV2(s: GroupSettings): InlineKeyboard {
  return new InlineKeyboard()
    .text(`${s.cleanerEnabled ? on : off} Cleaner`, 'toggle:cleanerEnabled')
    .row()
    .text(`${s.cleanJoin ? on : off} Join`, 'toggle:cleanJoin')
    .text(`${s.cleanLeave ? on : off} Leave`, 'toggle:cleanLeave')
    .row()
    .text(`${s.cleanPhotoChange ? on : off} Photo`, 'toggle:cleanPhotoChange')
    .text(`${s.cleanPinnedMessage ? on : off} Pinned`, 'toggle:cleanPinnedMessage')
    .row()
    .text(`${s.cleanTitleChange ? on : off} Title`, 'toggle:cleanTitleChange')
    .row()
    .text('⬅️ Bosh menyu', 'menu:main');
}

export function antispamKeyboardV2(s: GroupSettings): InlineKeyboard {
  return new InlineKeyboard()
    .text(`${s.antispamEnabled ? on : off} Antispam`, 'toggle:antispamEnabled')
    .row()
    .text(`${s.floodControl ? on : off} Flood`, 'toggle:floodControl')
    .text(`${s.antiRepeat ? on : off} Repeat`, 'toggle:antiRepeat')
    .row()
    .text(`${s.antiEmojiSpam ? on : off} Emoji`, 'toggle:antiEmojiSpam')
    .text(`${s.antiMentionSpam ? on : off} Mention`, 'toggle:antiMentionSpam')
    .row()
    .text(`${s.antiLinkSpam ? on : off} Link`, 'toggle:antiLinkSpam')
    .text(`${s.antiForwardSpam ? on : off} Forward`, 'toggle:antiForwardSpam')
    .row()
    .text('⬅️ Bosh menyu', 'menu:main');
}

export function protectionKeyboardV2(s: GroupSettings): InlineKeyboard {
  return new InlineKeyboard()
    .text(`${s.protectionEnabled ? on : off} Himoya`, 'toggle:protectionEnabled')
    .row()
    .text(`${s.antiPorn ? on : off} Porn`, 'toggle:antiPorn')
    .text(`${s.antiScam ? on : off} Scam`, 'toggle:antiScam')
    .row()
    .text(`${s.antiFakeCrypto ? on : off} Fake Crypto`, 'toggle:antiFakeCrypto')
    .text(`${s.filterNsfw ? on : off} NSFW`, 'toggle:filterNsfw')
    .row()
    .text(`${s.filterInviteLinks ? on : off} Invite`, 'toggle:filterInviteLinks')
    .text(`${s.restrictNewUsers ? on : off} New restrict`, 'toggle:restrictNewUsers')
    .row()
    .text(`${s.antiRaidEnabled ? on : off} Anti-Raid`, 'toggle:antiRaidEnabled')
    .row()
    .text(`Jazo: ${s.protectionAction}`, 'cycle:protectionAction')
    .row()
    .text('⬅️ Bosh menyu', 'menu:main');
}

export function warnsKeyboardV2(s: GroupSettings): InlineKeyboard {
  return new InlineKeyboard()
    .text('➖', 'warnlimit:dec')
    .text(`Limit: ${s.warnLimit}`, 'warnlimit:edit')
    .text('➕', 'warnlimit:inc')
    .row()
    .text(`Jazo: ${s.warnAction}`, 'cycle:warnAction')
    .row()
    .text('⬅️ Bosh menyu', 'menu:main');
}

export function loggingKeyboardV2(s: GroupSettings): InlineKeyboard {
  const kb = new InlineKeyboard()
    .text(`${s.logEnabled ? on : off} Logging`, 'toggle:logEnabled')
    .row()
    .text('📍 Hozirgi chatni log qilish', 'logchat:current');
  if (s.logChatId) kb.row().text('🗑 Log chatni o\'chirish', 'logchat:clear');
  kb.row().text('⬅️ Bosh menyu', 'menu:main');
  return kb;
}

export function pluginsKeyboardV2(s: GroupSettings): InlineKeyboard {
  return new InlineKeyboard()
    .text(`${s.welcomeEnabled ? on : off} Welcome`, 'toggle:welcomeEnabled')
    .text('✏️ Welcome matni', 'conv:setWelcome')
    .row()
    .text(`${s.rulesEnabled ? on : off} Qoidalar`, 'toggle:rulesEnabled')
    .text('✏️ Qoidalar matni', 'conv:setRules')
    .row()
    .text(`${s.autoRulesOnJoin ? on : off} Auto qoidalar (DM)`, 'toggle:autoRulesOnJoin')
    .row()
    .text(`${s.captchaEnabled ? on : off} Captcha`, 'toggle:captchaEnabled')
    .row()
    .text('⬅️ Bosh menyu', 'menu:main');
}

export function keywordsKeyboardV2(list: Keyword[]): InlineKeyboard {
  const kb = new InlineKeyboard();
  kb.text('➕ Yangi so\'z qo\'shish', 'conv:addKeyword').row();
  list.slice(0, 20).forEach((k) => {
    const label = k.pattern.length > 20 ? k.pattern.slice(0, 17) + '...' : k.pattern;
    kb.text(`🗑 ${label}`, `kwdel:${k.id}`).row();
  });
  kb.text('⬅️ Bosh menyu', 'menu:main');
  return kb;
}

export function helpKeyboard(): InlineKeyboard {
  return new InlineKeyboard().text('⬅️ Bosh menyu', 'menu:main');
}

// ─── Moderation action buttons (reply) ──────────────────────────────────────

export function modActionsKeyboard(userId: number): InlineKeyboard {
  return new InlineKeyboard()
    .text('⚠️ Warn', `mod:warn:${userId}`)
    .text('🔇 Mute 1h', `mod:mute60:${userId}`)
    .row()
    .text('👢 Kick', `mod:kick:${userId}`)
    .text('🚫 Ban', `mod:ban:${userId}`)
    .row()
    .text('🔊 Unmute', `mod:unmute:${userId}`)
    .text('✅ Unban', `mod:unban:${userId}`)
    .row()
    .text('🗑 Yopish', 'mod:close');
}

// ─── Helpers ────────────────────────────────────────────────────────────────

export const PUNISHMENT_CYCLE: PunishmentType[] = [
  'WARN',
  'MUTE',
  'TEMP_MUTE',
  'KICK',
  'BAN',
  'TEMP_BAN',
  'DELETE',
] as unknown as PunishmentType[];

export function nextPunishment(current: PunishmentType): PunishmentType {
  const idx = PUNISHMENT_CYCLE.indexOf(current);
  return PUNISHMENT_CYCLE[(idx + 1) % PUNISHMENT_CYCLE.length];
}
