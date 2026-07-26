import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
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
  SortOrderEnum,
  generateUniqueId,
} from '@shared';
import { SendMessageDto } from './dtos';
import { EchoBotHandler, IgnoreBotHandler, ReverseBotHandler, SpamBotHandler } from './bot-handlers';
import { ConfigType } from '@nestjs/config';
import config from './../config/config';

@Injectable()
export class ChatService implements OnModuleInit, OnModuleDestroy {
  private users = new Map<string, IUser>();
  private messages: IMessage[] = [];
  private server: Server;
  private botHandlers: Record<BotIdEnum, BaseBotHandler>;

  constructor(@Inject(config.KEY) private configService: ConfigType<typeof config>) {}

  onModuleInit(): void {
    this.initBots();
  }

  onModuleDestroy(): void {
    if (this.botHandlers) {
      for (const handler of Object.values(this.botHandlers)) {
        handler.stop?.();
      }
    }
  }

  setServer(server: Server): void {
    this.server = server;
    this.initBots();

    for (const handler of Object.values(this.botHandlers)) {
      handler.start?.(
        this.sendBotMessage.bind(this),
        this.getUsers.bind(this),
      );
    }
  }

  private initBots(): void {
    BaseBotHandler.avatarBaseUrl = this.configService.avatarBaseUrl;

    this.botHandlers = {
      [BotIdEnum.ECHO]: new EchoBotHandler(),
      [BotIdEnum.REVERSE]: new ReverseBotHandler(),
      [BotIdEnum.SPAM]: new SpamBotHandler(),
      [BotIdEnum.IGNORE]: new IgnoreBotHandler(),
    };

    for (const handler of Object.values(this.botHandlers)) {
      this.users.set(handler.profile.id, handler.profile);
    }
  }

  addUser(user: IUser): void {
    this.users.set(user.id, { ...user, isBot: false, status: UserStatusEnum.ONLINE });
  }

  setUserOffline(userId: string): void {
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
      
      const updatedPreviews = this.getChatPreviews({}, receiverId);
      this.server.to(receiverId).emit(SocketEventEnum.USERS_LIST, updatedPreviews);
    }
  }
}