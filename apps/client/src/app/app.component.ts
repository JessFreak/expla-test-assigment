import { Component, inject, OnInit } from '@angular/core';
import { ChatSocketService } from './services/chat-socket.service';
import { NgOptimizedImage } from '@angular/common';
import { UserService } from './services/user.service';
import { UserStatusEnum } from '@shared';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  imports: [
    NgOptimizedImage,
  ]
})
export class AppComponent implements OnInit {
  private readonly userService = inject(UserService);
  protected readonly socketService = inject(ChatSocketService);
  protected readonly UserStatusEnum = UserStatusEnum;

  ngOnInit(): void {
    const user = this.userService.getOrCreateProfile();
    this.socketService.connect(user);
  }
}