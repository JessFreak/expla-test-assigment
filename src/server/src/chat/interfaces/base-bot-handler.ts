import { User } from '../interfaces';

export type SendBotMessageCallback = (botId: string, receiverId: string, text: string) => void;
export type GetActiveUsersCallback = () => User[];

export abstract class BaseBotHandler {
  readonly profile: User;

  protected constructor(id: string, name: string, seed: string) {
    this.profile = {
      id,
      name,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`,
      isBot: true,
      status: 'online',
    };
  }

  abstract handle(
    targetUserId: string,
    text: string,
    sendCallback: SendBotMessageCallback,
  ): void;

  start?(
    sendCallback: SendBotMessageCallback,
    getUsersCallback: GetActiveUsersCallback,
  ): void {}

  stop?(): void {}
}