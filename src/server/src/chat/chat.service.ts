import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Server } from 'socket.io';
import { BaseBotHandler, Message, User } from './interfaces';
import { SendMessageDto } from './dtos';
import { EchoBotHandler, IgnoreBotHandler, ReverseBotHandler, SpamBotHandler } from './bot-handlers';

@Injectable()
export class ChatService implements OnModuleInit, OnModuleDestroy {
  private users = new Map<string, User>();
  private messages: Message[] = [];
  private server: Server;

  private readonly botHandlers: Record<string, BaseBotHandler> = {
    'bot-echo': new EchoBotHandler(),
    'bot-reverse': new ReverseBotHandler(),
    'bot-spam': new SpamBotHandler(),
    'bot-ignore': new IgnoreBotHandler(),
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

    // запуск спаму
    Object.values(this.botHandlers).forEach((handler) => {
      handler.start?.(
        this.sendBotMessage.bind(this),
        this.getUsers.bind(this)
      );
    });
  }

  addUser(user: User): void {
    this.users.set(user.id, { ...user, isBot: false, status: 'online' });
  }

  setUserOffline(userId: string) {
    const user = this.users.get(userId);
    if (user) {
      user.status = 'offline';
    }
  }

  getUsers(): User[] {
    return Array.from(this.users.values());
  }

  addMessage(senderId: string, dto: SendMessageDto): Message {
    const msg: Message = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      senderId,
      receiverId: dto.receiverId,
      text: dto.text,
      timestamp: Date.now(),
    };

    this.messages.push(msg);
    this.handleBotResponse(dto.receiverId, senderId, dto.text);
    return msg;
  }

  getMessagesBetween(user1Id: string, user2Id: string): Message[] {
    return this.messages.filter(
      (m) =>
        (m.senderId === user1Id && m.receiverId === user2Id) ||
        (m.senderId === user2Id && m.receiverId === user1Id),
    );
  }

  private handleBotResponse(botId: string, targetUserId: string, text: string): void {
    const handler = this.botHandlers[botId];
    if (handler) {
      handler.handle(targetUserId, text, this.sendBotMessage.bind(this));
    }
  }

  private sendBotMessage(botId: string, receiverId: string, text: string): void {
    const msg: Message = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      senderId: botId,
      receiverId,
      text,
      timestamp: Date.now(),
    };
    this.messages.push(msg);

    if (this.server) {
      this.server.emit('messageReceived', msg);
    }
  }
}