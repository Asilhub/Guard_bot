import { Bot } from 'grammy';
import { BotContext } from '../types';

export interface IPlugin {
  name: string;
  version: string;
  description: string;
  load(bot: Bot<BotContext>): void | Promise<void>;
  unload?(): void | Promise<void>;
}
