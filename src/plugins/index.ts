import { Bot } from 'grammy';
import { BotContext } from '../types';
import { IPlugin } from './plugin.interface';
import { welcomePlugin } from './welcome/welcome.plugin';
import { rulesPlugin } from './rules/rules.plugin';
import { captchaPlugin } from './captcha/captcha.plugin';
import { createModuleLogger } from '../utils/logger';

const log = createModuleLogger('plugins');

const PLUGINS: IPlugin[] = [
  welcomePlugin,
  rulesPlugin,
  captchaPlugin,
];

export async function loadPlugins(bot: Bot<BotContext>): Promise<void> {
  for (const plugin of PLUGINS) {
    try {
      await plugin.load(bot);
      log.info(`Plugin loaded: ${plugin.name} v${plugin.version}`);
    } catch (err) {
      log.error(`Plugin load failed: ${plugin.name}`, err);
    }
  }
}
