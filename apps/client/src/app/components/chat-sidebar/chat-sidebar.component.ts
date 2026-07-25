import { Component, EventEmitter, input, Output, signal } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IChatPreview, IGetUsersQuery, UserFilterEnum, UserStatusEnum } from '@shared';
import { TimeAgoPipe } from '../../pipes/time-ago.pipe';

@Component({
  selector: 'app-chat-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule, NgOptimizedImage, TimeAgoPipe],
  templateUrl: './chat-sidebar.component.html',
  styleUrls: ['./chat-sidebar.component.scss'],
})
export class ChatSidebarComponent {
  public previews = input<IChatPreview[]>([]);
  public selectedUserId = input<string | null>(null);

  @Output() selectUser = new EventEmitter<string>();
  @Output() filterChange = new EventEmitter<IGetUsersQuery>();

  public searchQuery = signal<string>('');
  public filter = signal<UserFilterEnum>(UserFilterEnum.ALL);

  protected readonly UserStatusEnum = UserStatusEnum;
  protected readonly UserFilterEnum = UserFilterEnum;

  public onSearchChange(search: string): void {
    this.searchQuery.set(search);
    this.emitFilter();
  }

  public setFilter(filter: UserFilterEnum): void {
    this.filter.set(filter);
    this.emitFilter();
  }

  private emitFilter(): void {
    this.filterChange.emit({
      filter: this.filter(),
      search: this.searchQuery(),
    });
  }

  public onSelect(userId: string): void {
    this.selectUser.emit(userId);
  }
}