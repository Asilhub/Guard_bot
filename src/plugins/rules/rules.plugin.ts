import { Bot } from 'grammy';
import { BotContext } from '../../types';
import { IPlugin } from '../plugin.interface';
import { groupService } from '../../services/group.service';
import { requireAdmin, requireGroup } from '../../middleware';

export class RulesPlugin implements IPlugin {
  name = 'rules';
  version = '1.0.0';
  description = 'Group rules management';

  load(bot: Bot<BotContext>): void {
    bot.command('rules', requireGroup, async (ctx) => {
      const settings = ctx.group?.settings;
      if (!settings?.rulesEnabled || !settings.rulesText) {
        return ctx.reply('ℹ️ Bu guruhda qoidalar hali sozlanmagan.');
      }
      await ctx.reply(`📋 <b>Guruh qoidalari:</b>\n\n${settings.rulesText}`, { parse_mode: 'HTML' });
    });

    bot.command('setrules', requireGroup, requireAdmin, async (ctx) => {
      if (!ctx.group) return;
      const text = ctx.match?.trim();
      if (!text) return ctx.reply('Ishlatish: <code>/setrules &lt;qoidalar matni&gt;</code>', { parse_mode: 'HTML' });

      await groupService.updateSettings(ctx.group.id, { rulesEnabled: true, rulesText: text });
      await ctx.reply('✅ Qoidalar saqlandi. /rules buyrug\'i bilan ko\'rish mumkin.');
    });

    // Auto-send rules on new member join
    bot.on('message:new_chat_members', async (ctx, next) => {
      const settings = ctx.group?.settings;
      if (!settings?.autoRulesOnJoin || !settings.rulesEnabled || !settings.rulesText) return next();

      for (const member of ctx.message.new_chat_members) {
        if (member.is_bot) continue;
        try {
          await ctx.api.sendMessage(member.id,
            `👋 Guruhga xush kelibsiz!\n\n📋 <b>Qoidalar:</b>\n${settings.rulesText}`,
            { parse_mode: 'HTML' },
          );
        } catch {
          // User may have blocked the bot
        }
      }

      return next();
    });
  }
}

export const rulesPlugin = new RulesPlugin();
