import { Component, EventEmitter, input, Output, signal } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IMessage, IUser, UserStatusEnum } from '@shared';

@Component({
  selector: 'app-chat-window',
  standalone: true,
  imports: [CommonModule, FormsModule, NgOptimizedImage],
  templateUrl: './chat-window.component.html',
  styleUrls: ['./chat-window.component.scss'],
})
export class ChatWindowComponent {
  public activeContact = input<IUser | null>(null);
  public currentUserId = input<string | null>(null);
  public currentUserAvatar = input<string | null>(null);
  public messages = input<IMessage[]>([]);

  @Output() sendMessage = new EventEmitter<string>();
  @Output() goBack = new EventEmitter<void>();

  public draft = signal<string>('');

  protected readonly UserStatusEnum = UserStatusEnum;

  public send(): void {
    const text = this.draft().trim();
    if (!text) return;

    this.sendMessage.emit(text);
    this.draft.set('');
  }
}