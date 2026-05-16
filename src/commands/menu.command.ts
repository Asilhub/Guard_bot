import { Bot, InlineKeyboard } from 'grammy';
import { BotContext } from '../types';
import { groupService } from '../services/group.service';
import { keywordService } from '../services/keyword.service';
import { userService } from '../services/user.service';
import { punishmentService } from '../services/punishment.service';
import { prisma } from '../database/prisma';
import { PunishmentType } from '@prisma/client';
import { getDisplayName } from '../utils/helpers';
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
  bansText,
  bansKeyboard,
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

async function fetchActiveBans(groupId: string) {
  const punishments = await prisma.punishment.findMany({
    where: {
      groupId,
      type: {
        in: [
          PunishmentType.BAN,
          PunishmentType.TEMP_BAN,
          PunishmentType.MUTE,
          PunishmentType.TEMP_MUTE,
        ],
      },
      isActive: true,
    },
    include: { user: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  // Deduplicate per user (keep most recent).
  const seen = new Set<string>();
  const items: Array<{
    telegramId: bigint;
    name: string;
    reason: string | null;
    type: PunishmentType;
  }> = [];
  for (const p of punishments) {
    if (seen.has(p.userId)) continue;
    seen.add(p.userId);
    items.push({
      telegramId: p.user.telegramId,
      name: getDisplayName(p.user.firstName, p.user.lastName, p.user.username),
      reason: p.reason ?? null,
      type: p.type,
    });
  }
  return items;
}

async function renderPage(
  ctx: BotContext,
  page: keyof typeof PAGE_BUILDERS | 'main' | 'help' | 'keywords' | 'bans',
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
  if (page === 'bans') {
    if (!ctx.group) return;
    const items = await fetchActiveBans(ctx.group.id);
    await ctx.editMessageText(bansText(items), {
      parse_mode: 'HTML',
      reply_markup: bansKeyboard(items),
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

  // Help is allowed everywhere (including private chat from /start button).
  bot.callbackQuery('menu:help', async (ctx) => {
    if (ctx.chat?.type === 'private') {
      // No message edit context here — just send help text.
      await ctx.editMessageText(helpText(), { parse_mode: 'HTML', reply_markup: helpKeyboard() })
        .catch(async () => {
          await ctx.reply(helpText(), { parse_mode: 'HTML' });
        });
      await ctx.answerCallbackQuery();
      return;
    }
    await renderPage(ctx, 'help');
    await ctx.answerCallbackQuery();
  });

  // ─── Navigation ───────────────────────────────────────────────────────
  bot.callbackQuery(/^menu:(main|settings|cleaner|antispam|protection|keywords|warns|logging|plugins|bans|close)$/, requireAdmin, async (ctx) => {
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

  // ─── Unmute from restrictions page ────────────────────────────────────
  bot.callbackQuery(/^unmuteu:(\d+)$/, requireAdmin, async (ctx) => {
    if (!ctx.group) return ctx.answerCallbackQuery();
    const telegramUserId = parseInt(ctx.match[1], 10);
    const dbUser = await userService.getByTelegramId(BigInt(telegramUserId));
    if (!dbUser) {
      await ctx.answerCallbackQuery('❌ Foydalanuvchi topilmadi');
      return;
    }
    try {
      await punishmentService.unmute(
        bot,
        BigInt(ctx.chat!.id),
        telegramUserId,
        ctx.group.id,
        dbUser.id,
      );
      await renderPage(ctx, 'bans');
      await ctx.answerCallbackQuery('✅ Unmute qilindi');
    } catch (err) {
      await ctx.answerCallbackQuery(`❌ ${(err as Error).message}`);
    }
  });

  // ─── Unban from bans page ─────────────────────────────────────────────
  bot.callbackQuery(/^unban:(\d+)$/, requireAdmin, async (ctx) => {
    if (!ctx.group) return ctx.answerCallbackQuery();
    const telegramUserId = parseInt(ctx.match[1], 10);
    const dbUser = await userService.getByTelegramId(BigInt(telegramUserId));
    if (!dbUser) {
      await ctx.answerCallbackQuery('❌ Foydalanuvchi topilmadi');
      return;
    }
    try {
      await punishmentService.unban(
        bot,
        BigInt(ctx.chat!.id),
        telegramUserId,
        ctx.group.id,
        dbUser.id,
      );
      await renderPage(ctx, 'bans');
      await ctx.answerCallbackQuery('✅ Unban qilindi');
    } catch (err) {
      await ctx.answerCallbackQuery(`❌ ${(err as Error).message}`);
    }
  });

  // ─── Enter conversations ──────────────────────────────────────────────
  bot.callbackQuery(/^conv:(addKeyword|setWelcome|setRules|setLogChat)$/, requireAdmin, async (ctx) => {
    const name = ctx.match[1];
    await ctx.answerCallbackQuery();
    await ctx.conversation.enter(name);
  });
}
