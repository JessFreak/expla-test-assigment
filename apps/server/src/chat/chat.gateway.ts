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
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { SocketEventEnum, UserStatusEnum } from '@shared';
import { ConnectQueryDto, GetHistoryDto, GetUsersQueryDto, SendMessageDto } from './dtos';
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

  afterInit(server: Server): void {
    this.chatService.setServer(server);

    server.use(async (socket, next) => {
      const dto = plainToInstance(ConnectQueryDto, socket.handshake.query);
      const errors = await validate(dto);

      if (errors.length > 0) {
        return next(new Error('Unauthorized / Invalid query params'));
      }

      socket.data.user = dto;
      next();
    });
  }

  handleConnection(client: Socket): void {
    const queryDto: ConnectQueryDto = client.data.user;

    client.join(queryDto.id);

    this.chatService.addUser({
      id: queryDto.id,
      name: queryDto.name,
      avatar: queryDto.avatar,
      isBot: false,
      status: UserStatusEnum.ONLINE,
    });

    this.broadcastUsers();
  }

  handleDisconnect(client: Socket): void {
    const user: ConnectQueryDto = client.data.user;

    if (user?.id) {
      this.chatService.setUserOffline(user.id);
      this.broadcastUsers();
    }
  }

  @SubscribeMessage(SocketEventEnum.GET_USERS)
  handleGetUsers(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: GetUsersQueryDto,
  ): void {
    const currentUserId = client.data.user.id;
    const previews = this.chatService.getChatPreviews(body, currentUserId);

    client.emit(SocketEventEnum.USERS_LIST, previews);
  }

  @SubscribeMessage(SocketEventEnum.SEND_MESSAGE)
  handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: SendMessageDto,
  ): void {
    const senderId = client.data.user.id;
    const msg = this.chatService.addMessage(senderId, body);

    if (msg) {
      this.server
        .to([msg.receiverId, msg.senderId])
        .emit(SocketEventEnum.MESSAGE_RECEIVED, msg);

      const senderPreviews = this.chatService.getChatPreviews({}, senderId);
      client.emit(SocketEventEnum.USERS_LIST, senderPreviews);

      const receiverPreviews = this.chatService.getChatPreviews({}, msg.receiverId);
      this.server.to(msg.receiverId).emit(SocketEventEnum.USERS_LIST, receiverPreviews);
    }
  }

  @SubscribeMessage(SocketEventEnum.GET_HISTORY)
  handleGetHistory(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: GetHistoryDto,
  ): void {
    const senderId = client.data.user.id;
    const history = this.chatService.getMessagesBetween(senderId, body.withUserId);

    client.emit(SocketEventEnum.HISTORY_LIST, history);
  }

  private broadcastUsers(): void {
    this.server.sockets.sockets.forEach((socket) => {
      const userId = socket.data?.user?.id;
      if (userId) {
        const previews = this.chatService.getChatPreviews({}, userId);
        socket.emit(SocketEventEnum.USERS_LIST, previews);
      }
    });
  }
}