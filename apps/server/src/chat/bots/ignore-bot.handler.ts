import { BaseBotHandler } from './base-bot.handler';
import { BotIdEnum } from '@shared';

export class IgnoreBotHandler extends BaseBotHandler {
  constructor() {
    super(BotIdEnum.IGNORE, 'Ignore Bot', 'ignore');
  }

  handle(): null {
    return null;
  }
}