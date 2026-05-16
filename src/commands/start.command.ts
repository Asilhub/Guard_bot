import { Bot } from 'grammy';
import { BotContext } from '../types';

export function registerStartCommand(bot: Bot<BotContext>): void {
  bot.command('start', async (ctx) => {
    if (ctx.chat?.type !== 'private') return;

    await ctx.reply(
      `🤖 <b>GuardianBot V1</b> — Professional Guruh Boshqaruv Boti\n\n` +
      `<b>Imkoniyatlar:</b>\n` +
      `🧹 Service message cleaner\n` +
      `🔑 Kalit so'z filtri\n` +
      `🛡 Antispam tizimi\n` +
      `🚫 Porn/Scam himoya\n` +
      `⚠️ Warn tizimi\n` +
      `📋 Auto moderatsiya\n` +
      `📊 Logging tizimi\n` +
      `🔌 Plugin tizimi\n\n` +
      `<b>Ishlatish:</b>\n` +
      `1. Botni guruhingizga qo'shing\n` +
      `2. Botga admin huquqlari bering\n` +
      `3. /settings bilan sozlang\n\n` +
      `<b>Yordam:</b> /help`,
      { parse_mode: 'HTML' },
    );
  });

  bot.command('help', async (ctx) => {
    await ctx.reply(
      `📖 <b>GuardianBot V1 — Buyruqlar</b>\n\n` +
      `<b>⚙️ Sozlamalar:</b>\n` +
      `/settings — Bosh panel\n` +
      `/cleaner_on / /cleaner_off\n` +
      `/antispam_on / /antispam_off\n` +
      `/protection_on / /protection_off\n\n` +
      `<b>🔑 Kalit so'zlar:</b>\n` +
      `/addkeyword &lt;so'z&gt; [--regex]\n` +
      `/removekeyword &lt;so'z&gt;\n` +
      `/keywords — Ro'yxat\n\n` +
      `<b>⚠️ Warn:</b>\n` +
      `/warn [sabab] — Reply bilan\n` +
      `/unwarn — Reply bilan\n` +
      `/warns — Reply bilan\n\n` +
      `<b>🚫 Jazolar:</b>\n` +
      `/ban, /unban, /kick\n` +
      `/mute [vaqt], /unmute\n\n` +
      `<b>👥 Rollar:</b>\n` +
      `/promote, /demote\n` +
      `/blacklist, /whitelist\n\n` +
      `<b>📊 Log:</b>\n` +
      `/setlogchat, /logs\n\n` +
      `<b>📋 Qoidalar / Xush kelish:</b>\n` +
      `/setrules, /rules\n` +
      `/setwelcome, /welcome_off`,
      { parse_mode: 'HTML' },
    );
  });
}
