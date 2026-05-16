import { Bot, InlineKeyboard } from 'grammy';
import { BotContext } from '../types';

export function registerStartCommand(bot: Bot<BotContext>): void {
  bot.command('start', async (ctx) => {
    if (ctx.chat?.type !== 'private') return;

    const kb = new InlineKeyboard()
      .url('➕ Guruhga qo\'shish', `https://t.me/${ctx.me.username}?startgroup=true`)
      .row()
      .text('❓ Yordam', 'menu:help');

    await ctx.reply(
      `🤖 <b>GuardianBot V1.1</b> — Professional Guruh Boshqaruv Boti\n\n` +
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
      `3. <code>/menu</code> bilan boshqaring`,
      { parse_mode: 'HTML', reply_markup: kb },
    );
  });

  bot.command('help', async (ctx) => {
    await ctx.reply(
      `📖 <b>GuardianBot V1.1</b>\n\n` +
      `<b>🎛 Yangi boshqaruv:</b>\n` +
      `/menu — Tugmali boshqaruv paneli (tavsiya)\n` +
      `/actions — Reply qilingan foydalanuvchi ustida amallar\n\n` +
      `<b>🛡 Tezkor moderatsiya (reply bilan):</b>\n` +
      `/warn [sabab] · /unwarn · /warns\n` +
      `/ban [sabab] · /unban · /kick\n` +
      `/mute [vaqt] · /unmute\n` +
      `/promote · /demote\n` +
      `/blacklist · /whitelist\n\n` +
      `<b>⚙️ Eski komandalar:</b>\n` +
      `/settings · /cleaner · /antispam\n` +
      `/addkeyword · /removekeyword · /keywords\n` +
      `/setrules · /rules · /setwelcome\n` +
      `/setlogchat · /logs\n\n` +
      `<i>Eslatma: barcha eski komandalar ham ishlaydi.</i>`,
      { parse_mode: 'HTML' },
    );
  });
}
