import { IUser, UserStatusEnum } from '@shared';
export type SendBotMessageCallback = (botId: string, receiverId: string, text: string) => void;
export type GetActiveUsersCallback = () => IUser[];

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