import { BotIdEnum, UserStatusEnum } from '@shared';
import { getRandomElement, getRandomInt } from '@shared';
import { BaseBotHandler, GetActiveUsersCallback, SendBotMessageCallback } from './base-bot-handler';

const REVERSE_BOT_DELAY_MS = 3_000;

const SPAM_BOT_MIN_DELAY_MS = 10_000;
const SPAM_BOT_MAX_DELAY_MS = 120_000;
const SPAM_BOT_PHRASES = [
  'Hi!',
  '5800x3d for 200$!',
  'Hello? Anyone here?',
  'Subscribe!!!',
  'HIRE ME!',
  'HELLO. HERE IS MY RESUME...',
] as const;

export class EchoBotHandler extends BaseBotHandler {
  constructor() {
    super(BotIdEnum.ECHO, 'Echo Bot', 'echo');
  }

  handle(targetUserId: string, text: string, sendCallback: SendBotMessageCallback): void {
    sendCallback(this.profile.id, targetUserId, text);
  }
}

export class ReverseBotHandler extends BaseBotHandler {
  constructor() {
    super(BotIdEnum.REVERSE, 'Reverse Bot', 'reverse');
  }

  handle(targetUserId: string, text: string, sendCallback: SendBotMessageCallback): void {
    setTimeout(() => {
      const reversed = text.split('').reverse().join('');
      sendCallback(this.profile.id, targetUserId, reversed);
    }, REVERSE_BOT_DELAY_MS);
  }
}

export class IgnoreBotHandler extends BaseBotHandler {
  constructor() {
    super(BotIdEnum.IGNORE, 'Ignore Bot', 'ignore');
  }

  handle(): void {}
}

export class SpamBotHandler extends BaseBotHandler {
  private spamTimeout: NodeJS.Timeout | null = null;

  constructor() {
    super(BotIdEnum.SPAM, 'Spam Bot', 'spam');
  }

  handle(): void {}

  override start(sendCallback: SendBotMessageCallback, getUsersCallback: GetActiveUsersCallback): void {
    const scheduleNextSpam = () => {
      const randomDelay = getRandomInt(SPAM_BOT_MIN_DELAY_MS, SPAM_BOT_MAX_DELAY_MS);

      this.spamTimeout = setTimeout(() => {
        const activeUsers = getUsersCallback().filter(
          (u) => !u.isBot && u.status === UserStatusEnum.ONLINE,
        );

        if (activeUsers.length > 0) {
          const randomUser = getRandomElement(activeUsers);
          const randomPhrase = getRandomElement(SPAM_BOT_PHRASES);

          sendCallback(this.profile.id, randomUser.id, randomPhrase);
        }

        scheduleNextSpam();
      }, randomDelay);
    };

    scheduleNextSpam();
  }

  override stop(): void {
    if (this.spamTimeout) {
      clearTimeout(this.spamTimeout);
      this.spamTimeout = null;
    }
  }
}