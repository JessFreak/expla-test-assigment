import { Component, computed, EventEmitter, input, Output, signal } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IUser, UserStatusEnum } from '@shared';

@Component({
  selector: 'app-chat-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule, NgOptimizedImage],
  templateUrl: './chat-sidebar.component.html',
  styleUrls: ['./chat-sidebar.component.scss'],
})
export class ChatSidebarComponent {
  public users = input<IUser[]>([]);
  public selectedUserId = input<string | null>(null);

  @Output() selectUser = new EventEmitter<string>();

  public searchQuery = signal<string>('');
  public filter = signal<'all' | 'online'>('all');

  protected readonly UserStatusEnum = UserStatusEnum;

  public filteredUsers = computed(() => {
    const list = this.users();
    const query = this.searchQuery().toLowerCase().trim();
    const currentFilter = this.filter();

    return list.filter((user) => {
      const matchesSearch = user.name.toLowerCase().includes(query);
      const matchesOnline = currentFilter === 'all' || user.status === UserStatusEnum.ONLINE;
      return matchesSearch && matchesOnline;
    });
  });

  public setFilter(type: 'all' | 'online'): void {
    this.filter.set(type);
  }

  public onSelect(userId: string): void {
    this.selectUser.emit(userId);
  }
}