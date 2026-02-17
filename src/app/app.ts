import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ChatComponent } from './chat/chat.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ChatComponent],
  template: `
    <div class="app-container">
      <header>
        <h1>Restaurant Tester AI Chat</h1>
      </header>
      <main class="split-view">
        <div class="chat-wrapper">
          <app-chat title="Chat Normal"></app-chat>
        </div>
        <div class="chat-wrapper">
          <app-chat title="Admin Chat" [isAdmin]="true"></app-chat>
        </div>
      </main>
      <router-outlet></router-outlet>
    </div>
  `,
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('restaurant-tester');
}
