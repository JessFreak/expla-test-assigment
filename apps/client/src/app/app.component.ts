import { Component, inject, OnInit, signal } from '@angular/core';
import { ChatSocketService } from './services/chat-socket.service';
import { UserService } from './services/user.service';
import { ChatSidebarComponent } from './components/chat-sidebar/chat-sidebar.component';
import { IGetUsersQuery } from '@shared';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  imports: [ChatSidebarComponent],
})
export class AppComponent implements OnInit {
  private readonly userService = inject(UserService);
  protected readonly socketService = inject(ChatSocketService);
  
  public selectedUserId = signal<string | null>(null);

  ngOnInit(): void {
    const user = this.userService.getOrCreateProfile();
    this.socketService.connect(user);
  }

  public onSelectUser(userId: string): void {
    this.selectedUserId.set(userId);
    this.socketService.loadHistory(userId);
  }

  public onFilterChange(query: IGetUsersQuery): void {
    this.socketService.getUsers(query);
  }
}