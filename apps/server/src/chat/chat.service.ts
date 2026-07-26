import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Server } from 'socket.io';
import { BaseBotHandler } from './base-bot-handler';
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
import { EchoBotHandler, IgnoreBotHandler, ReverseBotHandler, SpamBotHandler } from './bot-handlers';
import { ConfigType } from '@nestjs/config';
import config from './../config/config';

const FIRST_NAMES = [
  'Alex', 'Jordan', 'Taylor', 'Morgan', 'Sam', 'Chris', 'Riley', 'Casey',
  'Dakota', 'Jamie', 'Avery', 'Jesse', 'Reese', 'Rowan', 'Quinn', 'Skyler'
] as const;

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson'
] as const;

@Injectable()
export class ChatService implements OnModuleInit, OnModuleDestroy {
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
      handler.start?.(
        this.sendBotMessage.bind(this),
        this.getUsers.bind(this),
      );
    }
  }

  private initBots(): void {
    BaseBotHandler.avatarBaseUrl = `${this.configService.avatarBaseUrl}/bottts/svg`;

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

    const profile: IUser = {
      id,
      name: randomName,
      avatar: `${this.configService.avatarBaseUrl}/avataaars/svg?seed=${id}`,
      isBot: false,
      status: UserStatusEnum.ONLINE,
    };

    this.addUser(profile);

    return profile;
  }

  addUser(user: IUser): void {
    this.chatRepository.saveUser({ ...user, isBot: false, status: UserStatusEnum.ONLINE });
  }

  setUserOffline(userId: string): void {
    this.chatRepository.updateUserById(userId, { status: UserStatusEnum.OFFLINE });
  }

  getUsers(query?: IGetUsersQuery, excludeUserId?: string): IUser[] {
    return this.chatRepository.getUsers(query, excludeUserId);
  }

  getChatPreviews(query?: IGetUsersQuery, currentUserId?: string): IChatPreview[] {
    return this.chatRepository.getChatPreviews(query, currentUserId);
  }

  addMessage(senderId: string, dto: SendMessageDto): IMessage {
    const msg = this.chatRepository.createAndSaveMessage(senderId, dto.receiverId, dto.text);
    this.handleBotResponse(dto.receiverId, senderId, dto.text);
    return msg;
  }

  getMessagesBetween(user1Id: string, user2Id: string): IMessage[] {
    return this.chatRepository.getMessagesBetween(user1Id, user2Id);
  }

  private handleBotResponse(botId: string, targetUserId: string, text: string): void {
    const handler = this.botHandlers[botId as keyof typeof this.botHandlers];

    if (handler) {
      handler.handle(targetUserId, text, this.sendBotMessage.bind(this));
    }
  }

  private sendBotMessage(botId: string, receiverId: string, text: string): void {
    const msg = this.chatRepository.createAndSaveMessage(botId, receiverId, text);

    if (this.server) {
      this.server.to(receiverId).emit(SocketEventEnum.MESSAGE_RECEIVED, msg);

      const updatedPreviews = this.getChatPreviews({}, receiverId);
      this.server.to(receiverId).emit(SocketEventEnum.USERS_LIST, updatedPreviews);
    }
  }
}