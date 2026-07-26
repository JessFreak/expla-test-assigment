import { Injectable, signal, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { io, Socket } from 'socket.io-client';
import { SocketEventEnum, IUser, IMessage, IGetUsersQuery, IChatPreview } from '@shared';
import { environment } from '../../environments/environment';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root',
})
export class ChatSocketService {
  private http = inject(HttpClient);
  private userService = inject(UserService);

  private socket: Socket | null = null;

  public isConnected = signal<boolean>(false);
  public chatPreviews = signal<IChatPreview[]>([]);
  public messages = signal<IMessage[]>([]);
  public activeChatId = signal<string | null>(null);

  public connect(user: IUser): void {
    if (this.socket?.connected) return;

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

    this.socket.on(SocketEventEnum.USERS_LIST, (previews: IChatPreview[]) => {
      this.chatPreviews.set(previews);
    });

    this.socket.on(SocketEventEnum.MESSAGE_RECEIVED, (message: IMessage) => {
      const currentChatId = this.activeChatId();

      const isMessageForCurrentChat =
        message.senderId === currentChatId ||
        message.receiverId === currentChatId;

      if (isMessageForCurrentChat) {
        this.messages.update((prev) => [...prev, message]);
      }
    });
  }

  public getUsers(query?: IGetUsersQuery): void {
    const userId = this.userService.currentUser().id;

    let params = new HttpParams();
    if (query?.search) params = params.set('search', query.search);
    if (query?.filter) params = params.set('filter', query.filter);
    if (query?.sortByDate) params = params.set('sortByDate', query.sortByDate);

    this.http.get<IChatPreview[]>(`${environment.apiUrl}/api/chat/previews`, {
      params,
      headers: { 'x-user-id': userId }
    }).subscribe({
      next: (previews) => this.chatPreviews.set(previews),
      error: (err) => console.error('Failed to load chat previews', err)
    });
  }

  public loadHistory(withUserId: string): void {
    this.activeChatId.set(withUserId);
    const userId = this.userService.currentUser().id;

    this.http.get<IMessage[]>(`${environment.apiUrl}/api/chat/history/${withUserId}`, {
      headers: { 'x-user-id': userId }
    }).subscribe({
      next: (history) => this.messages.set(history),
      error: (err) => console.error('Failed to load history', err)
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