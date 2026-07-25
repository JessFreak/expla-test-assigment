import { Injectable, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { SocketEventEnum, IUser, IMessage, IGetUsersQuery } from '@shared';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ChatSocketService {
  private socket: Socket | null = null;
  private currentUser: IUser | null = null;

  public isConnected = signal<boolean>(false);
  public activeUsers = signal<IUser[]>([]);
  public messages = signal<IMessage[]>([]);

  public connect(user: IUser): void {
    if (this.socket?.connected) return;

    this.currentUser = user;

    this.socket = io(environment.apiUrl, {
      query: {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
      },
      transports: ['websocket'],
    });

    this.setupListeners();
  }

  private setupListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.isConnected.set(true);
    });

    this.socket.on('disconnect', () => {
      this.isConnected.set(false);
    });

    this.socket.on(SocketEventEnum.USERS_LIST, (users: IUser[]) => {
      this.activeUsers.set(users);
    });

    this.socket.on(SocketEventEnum.MESSAGE_RECEIVED, (message: IMessage) => {
      this.messages.update((prev) => [...prev, message]);
    });

    this.socket.on(SocketEventEnum.HISTORY_LIST, (history: IMessage[]) => {
      this.messages.set(history);
    });
  }

  public getUsers(query?: IGetUsersQuery): void {
    this.socket?.emit(SocketEventEnum.GET_USERS, query ?? {});
  }

  public loadHistory(withUserId: string): void {
    this.socket?.emit(SocketEventEnum.GET_HISTORY, { withUserId });
  }

  public sendMessage(receiverId: string, text: string): void {
    this.socket?.emit(SocketEventEnum.SEND_MESSAGE, { receiverId, text });
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected.set(false);
    }
  }
}