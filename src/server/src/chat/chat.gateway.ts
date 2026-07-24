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
import { User } from './interfaces';
import { UsePipes, ValidationPipe } from '@nestjs/common';
import { GetHistoryDto, SendMessageDto } from './dtos';

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
  }

  handleConnection(client: Socket) {
    const userData = client.handshake.query as unknown as User;
    if (userData && userData.id) {
      this.chatService.addUser({
        id: userData.id,
        name: userData.name || 'Anonymous',
        avatar: userData.avatar || '',
        isBot: false,
        status: 'online',
      });

      // сповістити всіх
      this.broadcastUsers();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.handshake.query.id as string;
    if (userId) {
      this.chatService.setUserOffline(userId);
      this.broadcastUsers();
    }
  }

  @UsePipes(new ValidationPipe({ transform: true }))
  @SubscribeMessage('sendMessage')
  handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: SendMessageDto,
  ) {
    const senderId = client.handshake.query.id as string;
    const msg = this.chatService.addMessage(senderId, body);

    if (msg) {
      this.server.emit('messageReceived', msg);
    }
  }

  @UsePipes(new ValidationPipe({ transform: true }))
  @SubscribeMessage('getHistory')
  handleGetHistory(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: GetHistoryDto,
  ) {
    const senderId = client.handshake.query.id as string;
    const history = this.chatService.getMessagesBetween(senderId, body.withUserId);
    client.emit('history', history);
  }

  private broadcastUsers() {
    this.server.emit('users', this.chatService.getUsers());
  }
}