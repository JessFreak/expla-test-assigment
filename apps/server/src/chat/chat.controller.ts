import { Controller, Get, Param, Query, Post } from '@nestjs/common';
import { ChatService } from './chat.service';
import { GetUsersQueryDto } from './dtos';
import { ChatRouteSegmentEnum, IChatPreview, IMessage, IUser } from '@shared';
import { CurrentUserId } from '../utils/current-user-id.decorator';

@Controller(ChatRouteSegmentEnum.BASE)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post(ChatRouteSegmentEnum.GENERATE_PROFILE)
  generateProfile(): IUser {
    return this.chatService.generateProfile();
  }

  @Get(ChatRouteSegmentEnum.PREVIEWS)
  getChatPreviews(
    @Query() query: GetUsersQueryDto,
    @CurrentUserId() currentUserId: string,
  ): { previews: IChatPreview[] } {
    return {
      previews: this.chatService.getChatPreviews(currentUserId, query),
    };
  }

  @Get(`${ChatRouteSegmentEnum.HISTORY}/:userId`)
  getHistory(
    @Param('userId') userId: string,
    @CurrentUserId() currentUserId: string,
  ): { messages: IMessage[] } {
    return {
      messages: this.chatService.getMessagesBetween(currentUserId, userId),
    };
  }
}