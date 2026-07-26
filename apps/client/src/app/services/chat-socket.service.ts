import { Injectable, signal, inject } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { SocketEventEnum, IUser, IMessage, IGetUsersQuery, IChatPreview } from '@shared';
import { environment } from '../../environments/environment';
import { ChatApiService } from './chat-api.service';

@Injectable({
  providedIn: 'root',
})
export class ChatSocketService {
  private chatApiService = inject(ChatApiService);
  private socket: Socket | null = null;

  public isConnected = signal<boolean>(false);
  public chatPreviews = signal<IChatPreview[]>([]);
  public messages = signal<IMessage[]>([]);
  public activeChatId = signal<string | null>(null);

  public connect(user: IUser): void {
    if (this.socket?.connected) return;

    this.socket = io(environment.socketUrl, {
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

    this.socket.on(SocketEventEnum.USERS_LIST, (previews: IChatPreview[]) => {
      this.chatPreviews.set(previews);
    });

    this.socket.on(SocketEventEnum.MESSAGE_RECEIVED, (message: IMessage) => {
      const currentChatId = this.activeChatId();
      if (message.senderId === currentChatId || message.receiverId === currentChatId) {
        this.messages.update((prev) => [...prev, message]);
      }
    });
  }

  public getUsers(query?: IGetUsersQuery): void {
    this.chatApiService.getChatPreviews(query).subscribe({
      next: (previews) => this.chatPreviews.set(previews),
      error: (err) => console.error('Failed to load chat previews', err),
    });
  }

  public loadHistory(withUserId: string): void {
    this.activeChatId.set(withUserId);

    this.chatApiService.getHistory(withUserId).subscribe({
      next: (history) => this.messages.set(history),
      error: (err) => console.error('Failed to load history', err),
    });
  }

  public sendMessage(receiverId: string, text: string): void {
    this.socket?.emit(SocketEventEnum.SEND_MESSAGE, { receiverId, text });
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected.set(false);
      this.activeChatId.set(null);
    }
  }
}