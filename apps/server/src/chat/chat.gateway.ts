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
        return next(new Error('Unauthorized / Invalid query params'));
      }

      socket.data.user = dto;
      next();
    });
  }

  handleConnection(client: Socket) {
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

  handleDisconnect(client: Socket) {
    const user: ConnectQueryDto = client.data.user;

    if (user.id) {
      this.chatService.setUserOffline(user.id);
      this.broadcastUsers();
    }
  }

  @SubscribeMessage(SocketEventEnum.SEND_MESSAGE)
  handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: SendMessageDto,
  ) {
    const senderId = client.data.user.id;
    const msg = this.chatService.addMessage(senderId, body);

    if (msg) {
      this.server
        .to([msg.receiverId, msg.senderId])
        .emit(SocketEventEnum.MESSAGE_RECEIVED, msg);
    }
  }

  @SubscribeMessage(SocketEventEnum.GET_HISTORY)
  handleGetHistory(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: GetHistoryDto,
  ) {
    const senderId = client.data.user.id;
    const history = this.chatService.getMessagesBetween(senderId, body.withUserId);

    client.emit(SocketEventEnum.HISTORY_LIST, history);
  }

  private broadcastUsers() {
    this.server.emit(SocketEventEnum.USERS_LIST, this.chatService.getUsers());
  }
}