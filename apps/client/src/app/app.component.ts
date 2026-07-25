import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ChatSocketService } from './services/chat-socket.service';
import { UserService } from './services/user.service';
import { ChatSidebarComponent } from './components/chat-sidebar/chat-sidebar.component';
import { ChatWindowComponent } from './components/chat-window/chat-window.component';
import { IGetUsersQuery, IUser } from '@shared';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  imports: [ChatSidebarComponent, ChatWindowComponent],
})
export class AppComponent implements OnInit {
  private readonly userService = inject(UserService);
  protected readonly socketService = inject(ChatSocketService);

  public currentUser = signal<IUser | null>(null);
  public selectedUserId = signal<string | null>(null);

  public activeContact = computed(() => {
    const id = this.selectedUserId();
    const preview = this.socketService.chatPreviews().find((p) => p.user.id === id);
    return preview ? preview.user : null;
  });

  ngOnInit(): void {
    const profile = this.userService.getOrCreateProfile();
    this.currentUser.set(profile);
    this.socketService.connect(profile);
  }

  public onSelectUser(userId: string): void {
    this.selectedUserId.set(userId);
    this.socketService.loadHistory(userId);
  }

  public onFilterChange(query: IGetUsersQuery): void {
    this.socketService.getUsers(query);
  }

  public onSendMessage(text: string): void {
    const receiverId = this.selectedUserId();
    if (receiverId) {
      this.socketService.sendMessage(receiverId, text);
    }
  }
}