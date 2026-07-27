import { BaseBotHandler } from './base-bot.handler';
import { BotIdEnum } from '@shared';
import { setTimeout as delay } from 'node:timers/promises';
import { REVERSE_BOT_DELAY_MS } from '../../utils/constants';

export class ReverseBotHandler extends BaseBotHandler {
  constructor() {
    super(BotIdEnum.REVERSE, 'Reverse Bot', 'reverse');
  }

  async handle(text: string): Promise<string> {
    await delay(REVERSE_BOT_DELAY_MS);
    return text.split('').reverse().join('');
  }
}