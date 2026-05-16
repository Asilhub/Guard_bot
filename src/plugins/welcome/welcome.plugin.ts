import { Bot } from 'grammy';
import { BotContext } from '../../types';
import { IPlugin } from '../plugin.interface';
import { groupService } from '../../services/group.service';
import { requireAdmin, requireGroup } from '../../middleware';
import { mention } from '../../utils/helpers';

export class WelcomePlugin implements IPlugin {
  name = 'welcome';
  version = '1.0.0';
  description = 'Welcome message for new members';

  load(bot: Bot<BotContext>): void {
    // Send welcome message on new member join
    bot.on('message:new_chat_members', async (ctx, next) => {
      const settings = ctx.group?.settings;
      if (!settings?.welcomeEnabled || !settings.welcomeMessage || !ctx.group) return next();

      // Only if cleaner hasn't deleted this message
      for (const member of ctx.message.new_chat_members) {
        if (member.is_bot) continue;

        const welcomeText = settings.welcomeMessage
          .replace('{name}', mention(member.id, member.first_name))
          .replace('{username}', member.username ? `@${member.username}` : member.first_name)
          .replace('{group}', ctx.chat.title ?? 'Guruh');

        await ctx.reply(welcomeText, { parse_mode: 'HTML' });
      }

      return next();
    });

    // /setwelcome command
    bot.command('setwelcome', requireGroup, requireAdmin, async (ctx) => {
      if (!ctx.group) return;
      const text = ctx.match?.trim();
      if (!text) {
        return ctx.reply(
          'Ishlatish: <code>/setwelcome Xush kelibsiz {name}!</code>\n\nO\'zgaruvchilar:\n• <code>{name}</code> — foydalanuvchi ismi\n• <code>{username}</code> — username\n• <code>{group}</code> — guruh nomi',
          { parse_mode: 'HTML' },
        );
      }
      await groupService.updateSettings(ctx.group.id, { welcomeEnabled: true, welcomeMessage: text });
      await ctx.reply(`✅ Welcome xabar saqlandi:\n\n${text}`, { parse_mode: 'HTML' });
    });

    bot.command('welcome_off', requireGroup, requireAdmin, async (ctx) => {
      if (!ctx.group) return;
      await groupService.updateSettings(ctx.group.id, { welcomeEnabled: false });
      await ctx.reply('❌ Welcome xabar o\'chirildi.');
    });
  }
}

export const welcomePlugin = new WelcomePlugin();
