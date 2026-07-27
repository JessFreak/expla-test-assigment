import { IUser, UserStatusEnum } from '@shared';

export interface BotContext {
  sendMessage(botId: string, receiverId: string, text: string): void;
  getActiveUsers(): IUser[];
}

export abstract class BaseBotHandler {
  readonly profile: IUser;
  static avatarBaseUrl: string;

  protected constructor(id: string, name: string, seed: string) {
    this.profile = {
      id,
      name,
      avatar: `${BaseBotHandler.avatarBaseUrl}?seed=${seed}`,
      isBot: true,
      status: UserStatusEnum.ONLINE,
    };
  }

  abstract handle(text: string): string | null | Promise<string | null>;

  start?(context: BotContext): void | Promise<void> {}

  stop?(): void {}
}
