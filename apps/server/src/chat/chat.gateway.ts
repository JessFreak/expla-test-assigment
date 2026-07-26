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
import { SocketEventEnum, UserStatusEnum, IChatPreview } from '@shared';
import { ConnectQueryDto, SendMessageDto } from './dtos';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

@WebSocketGateway()
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

    const user = {
      id: queryDto.id,
      name: queryDto.name,
      avatar: queryDto.avatar,
      isBot: false,
      status: UserStatusEnum.ONLINE,
    };
    this.chatService.addUser(user);

    client.broadcast.emit(SocketEventEnum.USER_ONLINE, user);
  }

  handleDisconnect(client: Socket): void {
    const user: ConnectQueryDto = client.data.user;

    if (user?.id) {
      this.chatService.setUserOffline(user.id);
      
      client.broadcast.emit(SocketEventEnum.USER_OFFLINE, user.id);
    }
  }

  @SubscribeMessage(SocketEventEnum.SEND_MESSAGE)
  handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: SendMessageDto,
  ): void {
    const senderId = client.data.user.id;
    const msg = this.chatService.addMessage(senderId, body);

    this.server
      .to([msg.receiverId, msg.senderId])
      .emit(SocketEventEnum.MESSAGE_RECEIVED, msg);

    const receiver = this.chatService.getUserById(msg.receiverId);
    if (receiver) {
      const updatedForSender: IChatPreview = {
        user: receiver,
        lastMessageText: msg.text,
        lastMessageTimestamp: msg.timestamp,
      };
      client.emit(SocketEventEnum.PREVIEW_UPDATED, updatedForSender);
    }

    const sender = this.chatService.getUserById(msg.senderId);
    if (sender) {
      const updatedForReceiver: IChatPreview = {
        user: sender,
        lastMessageText: msg.text,
        lastMessageTimestamp: msg.timestamp,
      };
      this.server.to(msg.receiverId).emit(SocketEventEnum.PREVIEW_UPDATED, updatedForReceiver);
    }
  }
}