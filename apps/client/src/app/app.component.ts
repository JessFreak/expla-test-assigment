import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { fromEvent, of, switchMap, take } from 'rxjs';
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
    this.whenActivated()
      .pipe(switchMap(() => this.userService.loadProfile()))
      .subscribe({
        next: (profile: IUser) => {
          this.currentUser.set(profile);
          this.socketService.connect(profile);

          this.socketService.getUsers();
        },
        error: (err) => console.error(err),
      });
  }

  // defers side effects (user creation) until the page is actually activated, since Chrome may prerender it first
  private whenActivated() {
    const isPrerendering = typeof document !== 'undefined' && (document as unknown as { prerendering?: boolean }).prerendering;

    if (!isPrerendering) {
      return of(void 0);
    }

    return fromEvent(document, 'prerenderingchange').pipe(take(1), switchMap(() => of(void 0)));
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

  public onBack(): void {
    this.selectedUserId.set(null);
  }
}