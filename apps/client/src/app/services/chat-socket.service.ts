import { Injectable, signal, inject } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { SocketEventEnum, IUser, IMessage, IGetUsersQuery, IChatPreview, UserStatusEnum } from '@shared';
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

    this.socket.on('connect', () => this.isConnected.set(true));
    this.socket.on('disconnect', () => this.isConnected.set(false));

    this.socket.on(SocketEventEnum.MESSAGE_RECEIVED, (message: IMessage) => {
      const currentChatId = this.activeChatId();
      if (message.senderId === currentChatId || message.receiverId === currentChatId) {
        this.messages.update((prev) => [...prev, message]);
      }
    });

    this.socket.on(SocketEventEnum.USER_ONLINE, (user: IUser) => {
      this.chatPreviews.update((previews) => {
        const exists = previews.find((p) => p.user.id === user.id);
        if (exists) {
          return previews.map((p) => (p.user.id === user.id ? { ...p, user } : p));
        }
        return [...previews, { user, lastMessageText: null, lastMessageTimestamp: null }];
      });
    });

    this.socket.on(SocketEventEnum.USER_OFFLINE, (userId: string) => {
      this.chatPreviews.update((previews) =>
        previews.map((p) =>
          p.user.id === userId
            ? { ...p, user: { ...p.user, status: UserStatusEnum.OFFLINE } }
            : p
        )
      );
    });

    this.socket.on(SocketEventEnum.PREVIEW_UPDATED, (updatedPreview: IChatPreview) => {
      this.chatPreviews.update((previews) => {
        const filtered = previews.filter((p) => p.user.id !== updatedPreview.user.id);

        return [updatedPreview, ...filtered].sort((a, b) => {
          const timeA = a.lastMessageTimestamp ?? 0;
          const timeB = b.lastMessageTimestamp ?? 0;
          return timeB - timeA;
        });
      });
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