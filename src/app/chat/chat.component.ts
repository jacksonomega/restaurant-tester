import { Component, ChangeDetectionStrategy, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common'; // Important for NgClass, DatePipe if used
import { ChatService } from './chat.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChatComponent {
  readonly chatService = inject(ChatService);
  
  // Expose signals for template
  readonly currentMode = this.chatService.currentMode;
  readonly isHumanChat = this.chatService.isHumanChat;
  readonly historyByMode = this.chatService.historyByMode;
  readonly currentChat = this.chatService.currentChat;
  readonly messages = this.chatService.messages;
  readonly isLoading = this.chatService.isLoading;
  readonly currentChatId = this.chatService.currentChatId;
  
  readonly currentMessage = signal('');

  updateMessage(event: Event) {
    const input = event.target as HTMLInputElement;
    this.currentMessage.set(input.value);
  }

  sendMessage() {
    const content = this.currentMessage();
    if (!content.trim()) return;
    
    this.chatService.sendMessage(content);
    this.currentMessage.set('');
  }
  
  createNewChat() {
    this.chatService.createNewChat();
  }
}
