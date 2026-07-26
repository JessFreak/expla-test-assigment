import { Controller, Get, Param, Query, Headers } from '@nestjs/common';
import { ChatService } from './chat.service';
import { GetUsersQueryDto } from './dtos';
import { IChatPreview, IMessage } from '@shared';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('previews')
  getChatPreviews(
    @Query() query: GetUsersQueryDto,
    @Headers('x-user-id') currentUserId: string,
  ): IChatPreview[] {
    return this.chatService.getChatPreviews(query, currentUserId);
  }

  @Get('history/:withUserId')
  getHistory(
    @Param('withUserId') withUserId: string,
    @Headers('x-user-id') currentUserId: string,
  ): IMessage[] {
    return this.chatService.getMessagesBetween(currentUserId, withUserId);
  }
}