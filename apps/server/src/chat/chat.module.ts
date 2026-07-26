import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { ChatRepository } from './chat.repository';
import { ChatController } from './chat.controller';

@Module({
  providers: [ChatGateway, ChatService, ChatRepository],
  controllers: [ChatController],
})
export class ChatModule {}