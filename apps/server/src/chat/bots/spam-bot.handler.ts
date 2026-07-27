import { BaseBotHandler, BotContext } from './base-bot.handler';
import { BotIdEnum, getRandomElement, getRandomInt } from '@shared';
import { SPAM_BOT_MAX_DELAY_MS, SPAM_BOT_MIN_DELAY_MS, SPAM_BOT_PHRASES } from '../../utils/constants';
import { setTimeout as delay } from 'node:timers/promises';

export class SpamBotHandler extends BaseBotHandler {
  private stopped = false;

  constructor() {
    super(BotIdEnum.SPAM, 'Spam Bot', 'spam');
  }

  handle(): null {
    return null;
  }

  override async start(context: BotContext): Promise<void> {
    this.stopped = false;

    while (!this.stopped) {
      const randomDelay = getRandomInt(SPAM_BOT_MIN_DELAY_MS, SPAM_BOT_MAX_DELAY_MS);
      await delay(randomDelay);

      if (this.stopped) break;

      const randomPhrase = getRandomElement(SPAM_BOT_PHRASES);
      for (const user of context.getActiveUsers()) {
        context.sendMessage(this.profile.id, user.id, randomPhrase);
      }
    }
  }

  override stop(): void {
    this.stopped = true;
  }
}