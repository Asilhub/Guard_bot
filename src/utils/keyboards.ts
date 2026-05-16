import { InlineKeyboard } from 'grammy';
import { GroupSettings } from '@prisma/client';

export function settingsKeyboard(settings: GroupSettings): InlineKeyboard {
  const on = '✅';
  const off = '❌';

  return new InlineKeyboard()
    .text(`${settings.cleanerEnabled ? on : off} Cleaner`, 'settings:cleaner')
    .text(`${settings.antispamEnabled ? on : off} Antispam`, 'settings:antispam')
    .row()
    .text(`${settings.protectionEnabled ? on : off} Himoya`, 'settings:protection')
    .text(`${settings.keywordEnabled ? on : off} Keywords`, 'settings:keywords')
    .row()
    .text(`${settings.logEnabled ? on : off} Logging`, 'settings:logging')
    .text(`${settings.silentMode ? on : off} Silent`, 'settings:silent')
    .row()
    .text('⚙️ Antispam sozlamalari', 'settings:antispam:detail')
    .row()
    .text('⚙️ Warn sozlamalari', 'settings:warns:detail')
    .row()
    .text('🔌 Plugins', 'settings:plugins')
    .text('❓ Yordam', 'settings:help');
}

export function cleanerSettingsKeyboard(settings: GroupSettings): InlineKeyboard {
  const on = '✅';
  const off = '❌';

  return new InlineKeyboard()
    .text(`${settings.cleanJoin ? on : off} Join xabari`, 'cleaner:join')
    .text(`${settings.cleanLeave ? on : off} Leave xabari`, 'cleaner:leave')
    .row()
    .text(`${settings.cleanPhotoChange ? on : off} Photo change`, 'cleaner:photo')
    .text(`${settings.cleanPinnedMessage ? on : off} Pinned`, 'cleaner:pinned')
    .row()
    .text(`${settings.cleanTitleChange ? on : off} Title change`, 'cleaner:title')
    .row()
    .text('⬅️ Orqaga', 'settings:main');
}

export function antispamSettingsKeyboard(settings: GroupSettings): InlineKeyboard {
  const on = '✅';
  const off = '❌';

  return new InlineKeyboard()
    .text(`${settings.floodControl ? on : off} Flood`, 'antispam:flood')
    .text(`${settings.antiRepeat ? on : off} Repeat`, 'antispam:repeat')
    .row()
    .text(`${settings.antiEmojiSpam ? on : off} Emoji spam`, 'antispam:emoji')
    .text(`${settings.antiMentionSpam ? on : off} Mention spam`, 'antispam:mention')
    .row()
    .text(`${settings.antiLinkSpam ? on : off} Link spam`, 'antispam:link')
    .text(`${settings.antiForwardSpam ? on : off} Forward spam`, 'antispam:forward')
    .row()
    .text('⬅️ Orqaga', 'settings:main');
}

export function confirmKeyboard(action: string, targetId?: string | number): InlineKeyboard {
  return new InlineKeyboard()
    .text('✅ Ha', `confirm:${action}:${targetId ?? ''}`)
    .text('❌ Yo\'q', `confirm:cancel`);
}

export function warnKeyboard(userId: number, groupId: string): InlineKeyboard {
  return new InlineKeyboard()
    .text('🔇 Mute', `action:mute:${userId}`)
    .text('👢 Kick', `action:kick:${userId}`)
    .text('🚫 Ban', `action:ban:${userId}`)
    .row()
    .text('❌ Warning olib tashlash', `action:unwarn:${userId}`);
}
