import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Server } from 'socket.io';
import { BaseBotHandler, BotContext } from './bots/base-bot.handler';
import { ChatRepository } from './chat.repository';
import {
  BotIdEnum,
  IMessage,
  SocketEventEnum,
  IUser,
  UserStatusEnum,
  IGetUsersQuery,
  IChatPreview,
  generateUniqueId,
  getRandomElement,
} from '@shared';
import { SendMessageDto } from './dtos';
import { ConfigType } from '@nestjs/config';
import config from './../config/config';
import { FIRST_NAMES, LAST_NAMES, BOT_AVATAR_STYLE, USER_AVATAR_STYLE } from '../utils/constants';
import { EchoBotHandler } from './bots/echo-bot.handler';
import { ReverseBotHandler } from './bots/reverse-bot.handler';
import { SpamBotHandler } from './bots/spam-bot.handler';
import { IgnoreBotHandler } from './bots/ignore-bot.handler';

@Injectable()
export class ChatService implements OnModuleInit, OnModuleDestroy, BotContext {
  private server: Server;
  private botHandlers: Record<BotIdEnum, BaseBotHandler>;

  constructor(
    @Inject(config.KEY) private configService: ConfigType<typeof config>,
    private readonly chatRepository: ChatRepository,
  ) {}

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
      handler.start?.(this);
    }
  }

  private initBots(): void {
    BaseBotHandler.avatarBaseUrl = `${this.configService.avatarBaseUrl}/${BOT_AVATAR_STYLE}`;

    this.botHandlers = {
      [BotIdEnum.ECHO]: new EchoBotHandler(),
      [BotIdEnum.REVERSE]: new ReverseBotHandler(),
      [BotIdEnum.SPAM]: new SpamBotHandler(),
      [BotIdEnum.IGNORE]: new IgnoreBotHandler(),
    };

    for (const handler of Object.values(this.botHandlers)) {
      this.chatRepository.saveUser(handler.profile);
    }
  }

  generateProfile(): IUser {
    const id = generateUniqueId();
    const randomName = `${getRandomElement(FIRST_NAMES)} ${getRandomElement(LAST_NAMES)}`;
    const avatar = `${this.configService.avatarBaseUrl}/${USER_AVATAR_STYLE}?seed=${id}`;

    return this.addUser({ id, name: randomName, avatar });
  }

  addUser(profile: Pick<IUser, 'id' | 'name' | 'avatar'>): IUser {
    return this.chatRepository.createUser(profile);
  }

  setUserOffline(userId: string): void {
    this.chatRepository.updateUserById(userId, { status: UserStatusEnum.OFFLINE });
  }
  
  getUserById(userId: string): IUser | null {
    return this.chatRepository.getUserById(userId);
  }

  getUsers(query?: IGetUsersQuery, excludeUserId?: string): IUser[] {
    return this.chatRepository.getUsers(query, excludeUserId);
  }

  getActiveUsers(): IUser[] {
    return this.getUsers().filter((u) => !u.isBot && u.status === UserStatusEnum.ONLINE);
  }

  getChatPreviews(currentUserId: string, query?: IGetUsersQuery, ): IChatPreview[] {
    return this.chatRepository.getChatPreviews(currentUserId, query);
  }

  addMessage(senderId: string, dto: SendMessageDto): IMessage {
    const msg = this.chatRepository.createAndSaveMessage(senderId, dto.receiverId, dto.text);
    void this.handleBotResponse(dto.receiverId, senderId, dto.text);
    return msg;
  }

  getMessagesBetween(user1Id: string, user2Id: string): IMessage[] {
    return this.chatRepository.getMessagesBetween(user1Id, user2Id);
  }

  private async handleBotResponse(botId: string, targetUserId: string, text: string): Promise<void> {
    const handler = this.botHandlers[botId as keyof typeof this.botHandlers];
    if (!handler) return;

    const reply = await handler.handle(text);
    if (reply !== null) {
      this.sendMessage(botId, targetUserId, reply);
    }
  }

  sendMessage(botId: string, receiverId: string, text: string): void {
    const msg = this.chatRepository.createAndSaveMessage(botId, receiverId, text);

    if (this.server) {
      this.server.to(receiverId).emit(SocketEventEnum.MESSAGE_RECEIVED, msg);

      const botUser = this.chatRepository.getUserById(botId);
      if (botUser) {
        const preview: IChatPreview = {
          user: botUser,
          lastMessageText: msg.text,
          lastMessageTimestamp: msg.timestamp,
        };
        this.server.to(receiverId).emit(SocketEventEnum.PREVIEW_UPDATED, preview);
      }
    }
  }
}