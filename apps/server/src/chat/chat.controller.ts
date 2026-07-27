import { Controller, Get, Param, Query, Post } from '@nestjs/common';
import { ChatService } from './chat.service';
import { GetUsersQueryDto } from './dtos';
import { IChatPreview, IMessage, IUser } from '@shared';
import { CurrentUserId } from '../utils/current-user-id.decorator';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('generate-profile')
  generateProfile(): IUser {
    return this.chatService.generateProfile();
  }

  @Get('previews')
  getChatPreviews(
    @Query() query: GetUsersQueryDto,
    @CurrentUserId() currentUserId: string,
  ): { previews: IChatPreview[] } {
    return {
      previews: this.chatService.getChatPreviews(currentUserId, query),
    };
  }

  @Get('history/:withUserId')
  getHistory(
    @Param('withUserId') withUserId: string,
    @CurrentUserId() currentUserId: string,
  ): { messages: IMessage[] } {
    return {
      messages: this.chatService.getMessagesBetween(currentUserId, withUserId),
    };
  }
}