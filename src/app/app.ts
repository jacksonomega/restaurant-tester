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
      <main>
        <div class="tabs">
          <button 
            [class.active]="activeTab() === 'normal'" 
            (click)="activeTab.set('normal')"
          >
            Chat Normal
          </button>
          <button 
            [class.active]="activeTab() === 'admin'" 
            (click)="activeTab.set('admin')"
          >
            Admin Chat
          </button>
        </div>
        
        <div class="chat-container" [style.display]="activeTab() === 'normal' ? 'block' : 'none'">
          <app-chat title="Chat Normal"></app-chat>
        </div>
        <div class="chat-container" [style.display]="activeTab() === 'admin' ? 'block' : 'none'">
          <app-chat title="Admin Chat"></app-chat>
        </div>
      </main>
      <router-outlet></router-outlet>
    </div>
  `,
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('restaurant-tester');
  protected readonly activeTab = signal<'normal' | 'admin'>('normal');
}
