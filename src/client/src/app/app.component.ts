import { Component } from '@angular/core';
import { BotIdEnum } from '@shared';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  protected bot = BotIdEnum.ECHO;
}
