import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { SocketEventEnum, IChatPreview } from '@shared';
import { ConnectQueryDto, SendMessageDto } from './dtos';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  WS_AUTH_ERROR_MESSAGE,
  WS_RECEIVER_NOT_FOUND_ERROR_MESSAGE,
  WS_SENDER_NOT_FOUND_ERROR_MESSAGE,
} from '../utils/constants';

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
        return next(new Error(WS_AUTH_ERROR_MESSAGE));
      }

      socket.data.user = dto;
      next();
    });
  }

  handleConnection(client: Socket): void {
    const queryDto: ConnectQueryDto = client.data.user;
    client.join(queryDto.id);

    const user = this.chatService.addUser({
      id: queryDto.id,
      name: queryDto.name,
      avatar: queryDto.avatar,
    });

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

    const sender = this.chatService.getUserById(senderId);
    if (!sender) {
      throw new WsException(WS_SENDER_NOT_FOUND_ERROR_MESSAGE);
    }

    const receiver = this.chatService.getUserById(body.receiverId);
    if (!receiver) {
      throw new WsException(WS_RECEIVER_NOT_FOUND_ERROR_MESSAGE);
    }

    const msg = this.chatService.addMessage(senderId, body);

    this.server
      .to([msg.receiverId, msg.senderId])
      .emit(SocketEventEnum.MESSAGE_RECEIVED, msg);

    const updatedForSender: IChatPreview = {
      user: receiver,
      lastMessageText: msg.text,
      lastMessageTimestamp: msg.timestamp,
    };
    client.emit(SocketEventEnum.PREVIEW_UPDATED, updatedForSender);

    const updatedForReceiver: IChatPreview = {
      user: sender,
      lastMessageText: msg.text,
      lastMessageTimestamp: msg.timestamp,
    };
    this.server.to(msg.receiverId).emit(SocketEventEnum.PREVIEW_UPDATED, updatedForReceiver);
  }
}