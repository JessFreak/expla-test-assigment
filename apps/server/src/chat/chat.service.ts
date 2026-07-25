import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Server } from 'socket.io';
import { BaseBotHandler } from './base-bot-handler';
import {
  BotIdEnum,
  IMessage,
  SocketEventEnum,
  IUser,
  UserStatusEnum,
  UserFilterEnum,
  IGetUsersQuery,
  applyFilters,
  applySort,
  IChatPreview,
  SortOrderEnum
} from '@shared';
import { SendMessageDto } from './dtos';
import { EchoBotHandler, IgnoreBotHandler, ReverseBotHandler, SpamBotHandler } from './bot-handlers';
import { generateUniqueId } from '@shared';

@Injectable()
export class ChatService implements OnModuleInit, OnModuleDestroy {
  private users = new Map<string, IUser>();
  private messages: IMessage[] = [];
  private server: Server;

  private readonly botHandlers: Record<BotIdEnum, BaseBotHandler> = {
    [BotIdEnum.ECHO]: new EchoBotHandler(),
    [BotIdEnum.REVERSE]: new ReverseBotHandler(),
    [BotIdEnum.SPAM]: new SpamBotHandler(),
    [BotIdEnum.IGNORE]: new IgnoreBotHandler(),
  };

  onModuleInit() {
    Object.values(this.botHandlers).forEach((handler) => {
      this.users.set(handler.profile.id, handler.profile);
    });
  }

  onModuleDestroy() {
    Object.values(this.botHandlers).forEach((handler) => handler.stop?.());
  }

  setServer(server: Server) {
    this.server = server;

    Object.values(this.botHandlers).forEach((handler) => {
      handler.start?.(
        this.sendBotMessage.bind(this),
        this.getUsers.bind(this),
      );
    });
  }

  addUser(user: IUser): void {
    this.users.set(user.id, { ...user, isBot: false, status: UserStatusEnum.ONLINE });
  }

  setUserOffline(userId: string) {
    const user = this.users.get(userId);
    if (user) {
      user.status = UserStatusEnum.OFFLINE;
    }
  }

  getUsers(query?: IGetUsersQuery, excludeUserId?: string): IUser[] {
    const searchLower = query?.search?.toLowerCase().trim();

    return applyFilters(
      this.users.values(),
      excludeUserId ? (user) => user.id !== excludeUserId : null,
      query?.filter === UserFilterEnum.ONLINE ? (user) => user.status === UserStatusEnum.ONLINE : null,
      searchLower ? (user) => user.name.toLowerCase().includes(searchLower) : null,
    );
  }

  getChatPreviews(query?: IGetUsersQuery, currentUserId?: string): IChatPreview[] {
    const filteredUsers = this.getUsers(query, currentUserId);

    const previews: IChatPreview[] = filteredUsers.map((user) => {
      const chatMessages = currentUserId ? this.getMessagesBetween(currentUserId, user.id) : [];
      const lastMessage = chatMessages.length > 0 ? chatMessages[chatMessages.length - 1] : null;

      return {
        user,
        lastMessageText: lastMessage?.text || null,
        lastMessageTimestamp: lastMessage?.timestamp || null,
      };
    });

    const isDesc = query?.sortByDate !== SortOrderEnum.ASC;

    return applySort(previews, (a, b) => {
      const timeA = a.lastMessageTimestamp || 0;
      const timeB = b.lastMessageTimestamp || 0;

      return isDesc ? timeB - timeA : timeA - timeB;
    });
  }

  addMessage(senderId: string, dto: SendMessageDto): IMessage {
    const msg: IMessage = {
      id: generateUniqueId(),
      senderId,
      receiverId: dto.receiverId,
      text: dto.text,
      timestamp: Date.now(),
    };

    this.messages.push(msg);
    this.handleBotResponse(dto.receiverId, senderId, dto.text);
    return msg;
  }

  getMessagesBetween(user1Id: string, user2Id: string): IMessage[] {
    return this.messages.filter(
      (m) =>
        (m.senderId === user1Id && m.receiverId === user2Id) ||
        (m.senderId === user2Id && m.receiverId === user1Id),
    );
  }

  private handleBotResponse(botId: string, targetUserId: string, text: string): void {
    const handler = this.botHandlers[botId as keyof typeof this.botHandlers];

    if (handler) {
      handler.handle(targetUserId, text, this.sendBotMessage.bind(this));
    }
  }

  private sendBotMessage(botId: string, receiverId: string, text: string): void {
    const msg: IMessage = {
      id: generateUniqueId(),
      senderId: botId,
      receiverId,
      text,
      timestamp: Date.now(),
    };
    this.messages.push(msg);

    if (this.server) {
      this.server.to(receiverId).emit(SocketEventEnum.MESSAGE_RECEIVED, msg);
    }
  }
}