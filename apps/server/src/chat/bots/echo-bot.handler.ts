import { BotIdEnum } from '@shared';
import { BaseBotHandler } from './base-bot.handler';

export class EchoBotHandler extends BaseBotHandler {
  constructor() {
    super(BotIdEnum.ECHO, 'Echo Bot', 'echo');
  }

  async handle(text: string): Promise<string> {
    return text;
  }
}