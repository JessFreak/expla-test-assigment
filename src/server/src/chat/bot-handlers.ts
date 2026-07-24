import { BaseBotHandler, GetActiveUsersCallback, SendBotMessageCallback } from './interfaces';

export class EchoBotHandler extends BaseBotHandler {
  constructor() {
    super('bot-echo', 'Echo Bot', 'echo');
  }

  handle(targetUserId: string, text: string, sendCallback: SendBotMessageCallback): void {
    sendCallback(this.profile.id, targetUserId, text);
  }
}

export class ReverseBotHandler extends BaseBotHandler {
  constructor() {
    super('bot-reverse', 'Reverse Bot', 'reverse');
  }

  handle(targetUserId: string, text: string, sendCallback: SendBotMessageCallback): void {
    setTimeout(() => {
      const reversed = text.split('').reverse().join('');
      sendCallback(this.profile.id, targetUserId, reversed);
    }, 3000);
  }
}

export class IgnoreBotHandler extends BaseBotHandler {
  constructor() {
    super('bot-ignore', 'Ignore Bot', 'ignore');
  }

  handle(): void {}
}

export class SpamBotHandler extends BaseBotHandler {
  private spamTimeout: NodeJS.Timeout | null = null;
  private readonly spamPhrases = [
    'Hi!',
    '5800x3d for 200$!',
    'Hello? Anyone here?',
    'Subscribe!!!',
    'HIRE ME!',
    'HELLO. HERE IS MY RESUME...'
  ];

  constructor() {
    super('bot-spam', 'Spam Bot', 'spam');
  }

  handle(): void {}

  override start(sendCallback: SendBotMessageCallback, getUsersCallback: GetActiveUsersCallback): void {
    const scheduleNextSpam = () => {
      const randomDelay = Math.floor(Math.random() * (120 - 10 + 1) + 10) * 1000;

      this.spamTimeout = setTimeout(() => {
        const activeUsers = getUsersCallback().filter((u) => !u.isBot && u.status === 'online');

        if (activeUsers.length > 0) {
          const randomUser = activeUsers[Math.floor(Math.random() * activeUsers.length)];
          const randomPhrase = this.spamPhrases[Math.floor(Math.random() * this.spamPhrases.length)];
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