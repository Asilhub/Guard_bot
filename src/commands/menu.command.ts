import { Bot, InlineKeyboard } from 'grammy';
import { BotContext } from '../types';
import { groupService } from '../services/group.service';
import { keywordService } from '../services/keyword.service';
import { requireAdmin, requireGroup } from '../middleware';
import {
  mainMenuKeyboard,
  mainMenuText,
  settingsKeyboardV2,
  settingsText,
  cleanerKeyboardV2,
  cleanerText,
  antispamKeyboardV2,
  antispamText,
  protectionKeyboardV2,
  protectionText,
  warnsKeyboardV2,
  warnsText,
  loggingKeyboardV2,
  loggingText,
  pluginsKeyboardV2,
  pluginsText,
  keywordsKeyboardV2,
  keywordsText,
  helpKeyboard,
  helpText,
  nextPunishment,
} from '../utils/menus';
import { GroupSettings } from '@prisma/client';

const PAGE_BUILDERS: Record<
  string,
  (s: GroupSettings) => { text: string; keyboard: InlineKeyboard }
> = {
  settings: (s) => ({ text: settingsText(s), keyboard: settingsKeyboardV2(s) }),
  cleaner: (s) => ({ text: cleanerText(s), keyboard: cleanerKeyboardV2(s) }),
  antispam: (s) => ({ text: antispamText(s), keyboard: antispamKeyboardV2(s) }),
  protection: (s) => ({ text: protectionText(s), keyboard: protectionKeyboardV2(s) }),
  warns: (s) => ({ text: warnsText(s), keyboard: warnsKeyboardV2(s) }),
  logging: (s) => ({ text: loggingText(s), keyboard: loggingKeyboardV2(s) }),
  plugins: (s) => ({ text: pluginsText(s), keyboard: pluginsKeyboardV2(s) }),
};

const TOGGLEABLE_FIELDS: ReadonlySet<keyof GroupSettings> = new Set([
  'cleanerEnabled',
  'antispamEnabled',
  'protectionEnabled',
  'keywordEnabled',
  'logEnabled',
  'silentMode',
  'cleanJoin',
  'cleanLeave',
  'cleanPhotoChange',
  'cleanPinnedMessage',
  'cleanTitleChange',
  'floodControl',
  'antiRepeat',
  'antiEmojiSpam',
  'antiMentionSpam',
  'antiLinkSpam',
  'antiForwardSpam',
  'antiPorn',
  'antiScam',
  'antiFakeCrypto',
  'filterNsfw',
  'filterInviteLinks',
  'restrictNewUsers',
  'antiRaidEnabled',
  'welcomeEnabled',
  'rulesEnabled',
  'autoRulesOnJoin',
  'captchaEnabled',
]);

// Find which page a toggled field belongs to so we can refresh the right view.
function pageForField(field: keyof GroupSettings): keyof typeof PAGE_BUILDERS {
  if (field.startsWith('clean') && field !== 'cleanerEnabled') return 'cleaner';
  if (field === 'cleanerEnabled') return 'cleaner';
  if (
    [
      'floodControl',
      'antiRepeat',
      'antiEmojiSpam',
      'antiMentionSpam',
      'antiLinkSpam',
      'antiForwardSpam',
      'antispamEnabled',
    ].includes(field as string)
  ) {
    return 'antispam';
  }
  if (
    [
      'antiPorn',
      'antiScam',
      'antiFakeCrypto',
      'filterNsfw',
      'filterInviteLinks',
      'restrictNewUsers',
      'antiRaidEnabled',
      'protectionEnabled',
    ].includes(field as string)
  ) {
    return 'protection';
  }
  if (['welcomeEnabled', 'rulesEnabled', 'autoRulesOnJoin', 'captchaEnabled'].includes(field as string)) {
    return 'plugins';
  }
  if (field === 'logEnabled') return 'logging';
  return 'settings';
}

async function renderPage(
  ctx: BotContext,
  page: keyof typeof PAGE_BUILDERS | 'main' | 'help' | 'keywords',
): Promise<void> {
  if (page === 'main') {
    await ctx.editMessageText(mainMenuText(), {
      parse_mode: 'HTML',
      reply_markup: mainMenuKeyboard(),
    });
    return;
  }
  if (page === 'help') {
    await ctx.editMessageText(helpText(), { parse_mode: 'HTML', reply_markup: helpKeyboard() });
    return;
  }
  if (page === 'keywords') {
    if (!ctx.group) return;
    const list = await keywordService.list(ctx.group.id);
    await ctx.editMessageText(keywordsText(list), {
      parse_mode: 'HTML',
      reply_markup: keywordsKeyboardV2(list),
    });
    return;
  }
  if (!ctx.group?.settings) return;
  const fresh = await groupService.getByTelegramId(BigInt(ctx.chat!.id));
  if (!fresh?.settings) return;
  const { text, keyboard } = PAGE_BUILDERS[page](fresh.settings);
  await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: keyboard });
}

export function registerMenuCommand(bot: Bot<BotContext>): void {
  // ─── /menu entry point ────────────────────────────────────────────────
  bot.command('menu', requireGroup, requireAdmin, async (ctx) => {
    await ctx.reply(mainMenuText(), {
      parse_mode: 'HTML',
      reply_markup: mainMenuKeyboard(),
    });
  });

  // ─── Navigation ───────────────────────────────────────────────────────
  bot.callbackQuery(/^menu:(main|settings|cleaner|antispam|protection|keywords|warns|logging|plugins|help|close)$/, requireAdmin, async (ctx) => {
    const target = ctx.match[1];
    if (target === 'close') {
      await ctx.deleteMessage().catch(() => {});
      await ctx.answerCallbackQuery();
      return;
    }
    await renderPage(ctx, target as Parameters<typeof renderPage>[1]);
    await ctx.answerCallbackQuery();
  });

  // ─── Generic boolean toggles ──────────────────────────────────────────
  bot.callbackQuery(/^toggle:(\w+)$/, requireAdmin, async (ctx) => {
    if (!ctx.group?.settings) return ctx.answerCallbackQuery();
    const field = ctx.match[1] as keyof GroupSettings;
    if (!TOGGLEABLE_FIELDS.has(field)) return ctx.answerCallbackQuery('Noto\'g\'ri');
    const current = ctx.group.settings[field] as boolean;
    await groupService.updateSettings(ctx.group.id, { [field]: !current });
    await renderPage(ctx, pageForField(field));
    await ctx.answerCallbackQuery(!current ? '✅ Yoqildi' : '❌ O\'chirildi');
  });

  // ─── Cycle punishment action ──────────────────────────────────────────
  bot.callbackQuery(/^cycle:(protectionAction|warnAction|keywordAction)$/, requireAdmin, async (ctx) => {
    if (!ctx.group?.settings) return ctx.answerCallbackQuery();
    const field = ctx.match[1] as 'protectionAction' | 'warnAction' | 'keywordAction';
    const next = nextPunishment(ctx.group.settings[field]);
    await groupService.updateSettings(ctx.group.id, { [field]: next });
    const page = field === 'warnAction' ? 'warns' : 'protection';
    await renderPage(ctx, page);
    await ctx.answerCallbackQuery(`→ ${next}`);
  });

  // ─── Warn limit +/- ───────────────────────────────────────────────────
  bot.callbackQuery(/^warnlimit:(inc|dec|edit)$/, requireAdmin, async (ctx) => {
    if (!ctx.group?.settings) return ctx.answerCallbackQuery();
    const action = ctx.match[1];
    if (action === 'edit') {
      await ctx.answerCallbackQuery();
      await ctx.conversation.enter('setWarnLimit');
      return;
    }
    const cur = ctx.group.settings.warnLimit;
    const next = action === 'inc' ? Math.min(20, cur + 1) : Math.max(1, cur - 1);
    if (next !== cur) {
      await groupService.updateSettings(ctx.group.id, { warnLimit: next });
    }
    await renderPage(ctx, 'warns');
    await ctx.answerCallbackQuery(`Limit: ${next}`);
  });

  // ─── Log chat actions ─────────────────────────────────────────────────
  bot.callbackQuery('logchat:current', requireAdmin, async (ctx) => {
    if (!ctx.group) return ctx.answerCallbackQuery();
    await groupService.updateSettings(ctx.group.id, {
      logEnabled: true,
      logChatId: BigInt(ctx.chat!.id),
    });
    await renderPage(ctx, 'logging');
    await ctx.answerCallbackQuery('✅ Hozirgi chat log sifatida sozlandi');
  });

  bot.callbackQuery('logchat:clear', requireAdmin, async (ctx) => {
    if (!ctx.group) return ctx.answerCallbackQuery();
    await groupService.updateSettings(ctx.group.id, { logChatId: null });
    await renderPage(ctx, 'logging');
    await ctx.answerCallbackQuery('🗑 Log chat o\'chirildi');
  });

  // ─── Keyword delete ───────────────────────────────────────────────────
  bot.callbackQuery(/^kwdel:(.+)$/, requireAdmin, async (ctx) => {
    if (!ctx.group) return ctx.answerCallbackQuery();
    const id = ctx.match[1];
    await keywordService.removeById(ctx.group.id, id);
    await renderPage(ctx, 'keywords');
    await ctx.answerCallbackQuery('🗑 O\'chirildi');
  });

  // ─── Enter conversations ──────────────────────────────────────────────
  bot.callbackQuery(/^conv:(addKeyword|setWelcome|setRules|setLogChat)$/, requireAdmin, async (ctx) => {
    const name = ctx.match[1];
    await ctx.answerCallbackQuery();
    await ctx.conversation.enter(name);
  });
}
