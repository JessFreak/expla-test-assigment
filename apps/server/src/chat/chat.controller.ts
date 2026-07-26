import { Controller, Get, Param, Query, Headers, Post } from '@nestjs/common';
import { ChatService } from './chat.service';
import { GetUsersQueryDto } from './dtos';
import { IChatPreview, IMessage, IUser } from '@shared';

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