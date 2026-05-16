import { Bot } from 'grammy';
import { InlineKeyboard } from 'grammy';
import { BotContext } from '../../types';
import { IPlugin } from '../plugin.interface';
import { redis } from '../../database/redis';
import { createModuleLogger } from '../../utils/logger';

const log = createModuleLogger('captcha');

function generateMath(): { question: string; answer: number } {
  const a = Math.floor(Math.random() * 10) + 1;
  const b = Math.floor(Math.random() * 10) + 1;
  const ops = ['+', '-', '*'] as const;
  const op = ops[Math.floor(Math.random() * ops.length)];
  const answerMap = { '+': a + b, '-': a - b, '*': a * b };
  return { question: `${a} ${op} ${b} = ?`, answer: answerMap[op] };
}

function shuffleOptions(correct: number): number[] {
  const wrong = new Set<number>();
  while (wrong.size < 3) {
    const v = correct + Math.floor(Math.random() * 11) - 5;
    if (v !== correct) wrong.add(v);
  }
  return [correct, ...wrong].sort(() => Math.random() - 0.5);
}

export class CaptchaPlugin implements IPlugin {
  name = 'captcha';
  version = '1.0.0';
  description = 'Math captcha for new members';

  load(bot: Bot<BotContext>): void {
    bot.on('message:new_chat_members', async (ctx, next) => {
      const settings = ctx.group?.settings;
      if (!settings?.captchaEnabled || !ctx.group) return next();

      for (const member of ctx.message.new_chat_members) {
        if (member.is_bot) continue;

        // Restrict until captcha is passed
        try {
          await ctx.api.restrictChatMember(ctx.chat.id, member.id, {
            can_send_messages: false,
          });
        } catch { continue; }

        const { question, answer } = generateMath();
        const options = shuffleOptions(answer);
        const keyboard = new InlineKeyboard();
        options.forEach(opt => keyboard.text(String(opt), `captcha:${member.id}:${opt}:${answer}`));

        const captchaMsg = await ctx.reply(
          `👋 <a href="tg://user?id=${member.id}">${member.first_name}</a>, siz bot emasligingizni isbotlang!\n\n🧮 <b>${question}</b>`,
          { parse_mode: 'HTML', reply_markup: keyboard },
        );

        // Store and auto-kick on timeout
        const timeoutKey = `captcha:timeout:${ctx.chat.id}:${member.id}`;
        await redis.setex(timeoutKey, settings.captchaTimeout, captchaMsg.message_id.toString());

        setTimeout(async () => {
          const pending = await redis.get(timeoutKey);
          if (!pending) return; // Already answered
          await redis.del(timeoutKey);
          try {
            await ctx.api.banChatMember(ctx.chat.id, member.id);
            await ctx.api.unbanChatMember(ctx.chat.id, member.id);
            await ctx.api.deleteMessage(ctx.chat.id, captchaMsg.message_id);
          } catch {
            log.warn(`Captcha timeout kick failed for ${member.id}`);
          }
        }, settings.captchaTimeout * 1000);
      }

      return next();
    });

    // Captcha answer callback
    bot.callbackQuery(/^captcha:(\d+):(\d+):(\d+)$/, async (ctx) => {
      const [, userIdStr, answerStr, correctStr] = ctx.match;
      const userId = parseInt(userIdStr);
      const answer = parseInt(answerStr);
      const correct = parseInt(correctStr);

      if (ctx.from.id !== userId) {
        return ctx.answerCallbackQuery({ text: '❌ Bu captcha siz uchun emas!', show_alert: true });
      }

      const timeoutKey = `captcha:timeout:${ctx.chat!.id}:${userId}`;

      if (answer === correct) {
        await redis.del(timeoutKey);
        try {
          await ctx.api.restrictChatMember(ctx.chat!.id, userId, {
            can_send_messages: true,
            can_send_audios: true,
            can_send_documents: true,
            can_send_photos: true,
            can_send_videos: true,
            can_send_video_notes: true,
            can_send_voice_notes: true,
            can_send_polls: true,
            can_send_other_messages: true,
            can_add_web_page_previews: true,
          });
          await ctx.deleteMessage();
        } catch {}
        await ctx.answerCallbackQuery({ text: '✅ To\'g\'ri! Xush kelibsiz!', show_alert: true });
      } else {
        await ctx.answerCallbackQuery({ text: '❌ Noto\'g\'ri! Qayta urinib ko\'ring.', show_alert: true });
      }
    });
  }
}

export const captchaPlugin = new CaptchaPlugin();
