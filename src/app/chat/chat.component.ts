import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { ChatService } from './chat.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChatComponent {
  private readonly chatService = inject(ChatService);

  readonly messages = this.chatService.messages;
  readonly isLoading = this.chatService.isLoading;
  readonly currentApiUrl = this.chatService.apiUrl;
  
  readonly showConfig = signal(false);
  readonly currentMessage = signal('');

  toggleConfig() {
    this.showConfig.update(v => !v);
  }

  updateUrl(event: Event) {
    const input = event.target as HTMLInputElement;
    this.chatService.updateApiUrl(input.value);
  }

  updateMessage(event: Event) {
    const input = event.target as HTMLInputElement;
    this.currentMessage.set(input.value);
  }

  sendMessage() {
    const msg = this.currentMessage();
    if (msg.trim()) {
      this.chatService.sendMessage(msg);
      this.currentMessage.set('');
    }
  }
}
