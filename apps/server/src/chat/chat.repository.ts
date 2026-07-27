import { Injectable } from '@nestjs/common';
import {
  applyFilters, applySort, generateUniqueId,
  IChatPreview,
  IGetUsersQuery,
  IMessage,
  IUser,
  SortOrderEnum,
  UserFilterEnum,
  UserStatusEnum
} from '@shared';
import { CHAT_KEY_SEPARATOR } from '../utils/constants';

@Injectable()
export class ChatRepository {
  private static readonly NEW_USER_DEFAULTS: Pick<IUser, 'isBot' | 'status'> = {
    isBot: false,
    status: UserStatusEnum.ONLINE,
  };

  private readonly users = new Map<string, IUser>();
  private readonly messages = new Map<string, IMessage[]>();

  private getChatKey(user1Id: string, user2Id: string): string {
    return [user1Id, user2Id].sort().join(CHAT_KEY_SEPARATOR);
  }

  createUser(profile: Pick<IUser, 'id' | 'name' | 'avatar'>): IUser {
    const user: IUser = { ...profile, ...ChatRepository.NEW_USER_DEFAULTS };
    this.saveUser(user);
    return user;
  }

  saveUser(user: IUser): void {
    this.users.set(user.id, user);
  }

  getUserById(userId: string): IUser | null {
    return this.users.get(userId) ?? null;
  }

  updateUserById(userId: string, partialUser: Partial<IUser>): IUser | null {
    const existingUser = this.getUserById(userId);
    if (!existingUser) {
      return null;
    }

    const updatedUser = { ...existingUser, ...partialUser };
    this.users.set(userId, updatedUser);

    return updatedUser;
  }

  getUsers(query?: IGetUsersQuery, excludeUserId?: string): IUser[] {
    return applyFilters(
      this.users.values(),
      excludeUserId ? (user) => user.id !== excludeUserId : null,
      query?.filter === UserFilterEnum.ONLINE ? (user) => user.status === UserStatusEnum.ONLINE : null,
      query?.search ? (user) => user.name.toLowerCase().includes(query.search) : null,
    );
  }

  private saveMessage(msg: IMessage): void {
    const chatKey = this.getChatKey(msg.senderId, msg.receiverId);

    if (!this.messages.has(chatKey)) {
      this.messages.set(chatKey, []);
    }

    this.messages.get(chatKey)!.push(msg);
  }

  createAndSaveMessage(senderId: string, receiverId: string, text: string): IMessage {
    const msg: IMessage = {
      id: generateUniqueId(),
      senderId,
      receiverId,
      text,
      timestamp: Date.now(),
    };
    this.saveMessage(msg);
    return msg;
  }

  getMessagesBetween(user1Id: string, user2Id: string): IMessage[] {
    const chatKey = this.getChatKey(user1Id, user2Id);
    const chatMessages = this.messages.get(chatKey);

    return chatMessages ? [...chatMessages] : [];
  }

  getLastMessageBetween(user1Id: string, user2Id: string): IMessage | null {
    const chatKey = this.getChatKey(user1Id, user2Id);
    const chatMessages = this.messages.get(chatKey);

    if (!chatMessages || chatMessages.length === 0) {
      return null;
    }

    return chatMessages.at(-1) ?? null;
  }

  getChatPreviews(currentUserId: string, query?: IGetUsersQuery): IChatPreview[] {
    const filteredUsers = this.getUsers(query, currentUserId);

    const previews: IChatPreview[] = filteredUsers.map((user) => {
      const lastMessage = this.getLastMessageBetween(currentUserId, user.id)
      return {
        user,
        lastMessageText: lastMessage?.text ?? null,
        lastMessageTimestamp: lastMessage?.timestamp ?? null,
      };
    });

    const isDesc = query?.sortByDate !== SortOrderEnum.ASC;

    return applySort(previews, (a, b) => {
      const timeA = a.lastMessageTimestamp ?? 0;
      const timeB = b.lastMessageTimestamp ?? 0;

      return isDesc ? timeB - timeA : timeA - timeB;
    });
  }
}