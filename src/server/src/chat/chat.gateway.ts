import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { BadRequestException, UsePipes, ValidationPipe } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { SocketEventEnum, UserStatusEnum } from '@shared';
import { ConnectQueryDto, GetHistoryDto, SendMessageDto } from './dtos'
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly chatService: ChatService) {}

  afterInit(server: Server) {
    this.chatService.setServer(server);

    server.use(async (socket, next) => {
      const dto = plainToInstance(ConnectQueryDto, socket.handshake.query);
      const errors = await validate(dto);

      if (errors.length > 0) {
        return next(new BadRequestException('Unauthorized / Invalid query params'));
      }

      socket.data.user = dto;
      next();
    });
  }

  handleConnection(client: Socket) {
    const queryDto: ConnectQueryDto = client.data.user;

    this.chatService.addUser({
      id: queryDto.id,
      name: queryDto.name,
      avatar: queryDto.avatar,
      isBot: false,
      status: UserStatusEnum.ONLINE,
    });

    this.broadcastUsers();
  }

  handleDisconnect(client: Socket) {
    const userId = client.handshake.query.id as string;

    if (userId) {
      this.chatService.setUserOffline(userId);
      this.broadcastUsers();
    }
  }

  @UsePipes(new ValidationPipe({ transform: true }))
  @SubscribeMessage(SocketEventEnum.SEND_MESSAGE)
  handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: SendMessageDto,
  ) {
    const senderId = client.handshake.query.id as string;
    const msg = this.chatService.addMessage(senderId, body);

    if (msg) {
      this.server.emit(SocketEventEnum.MESSAGE_RECEIVED, msg);
    }
  }

  @UsePipes(new ValidationPipe({ transform: true }))
  @SubscribeMessage(SocketEventEnum.GET_HISTORY)
  handleGetHistory(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: GetHistoryDto,
  ) {
    const senderId = client.handshake.query.id as string;
    const history = this.chatService.getMessagesBetween(senderId, body.withUserId);

    client.emit(SocketEventEnum.HISTORY_LIST, history);
  }

  private broadcastUsers() {
    this.server.emit(SocketEventEnum.USERS_LIST, this.chatService.getUsers());
  }
}