import { Injectable, inject, signal, computed, effect, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Firestore, collection, onSnapshot, Unsubscribe } from '@angular/fire/firestore';
import { catchError, finalize, map, of, tap } from 'rxjs';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatHistoryItem {
  id: string;
  mode: 'admin' | 'client';
  title: string;
  updatedAt: number;
  messages: ChatMessage[];
}

export interface AgentResponse {
  respuesta: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  // private readonly firestore = inject(Firestore); // Commented out temporarily if not used logic changes
  
  private unsubscribe: Unsubscribe | null = null;

  // State
  readonly currentMode = signal<'admin' | 'client'>('client');
  readonly isHumanChat = signal(false);
  readonly currentChatId = signal<string | null>(null);
  readonly allHistory = signal<ChatHistoryItem[]>([]);
  readonly isLoading = signal(false);
  
  // Computed
  readonly historyByMode = computed(() => 
    this.allHistory()
      .filter(item => item.mode === this.currentMode())
      .sort((a, b) => b.updatedAt - a.updatedAt)
  );
  
  readonly currentChat = computed(() => 
    this.allHistory().find(c => c.id === this.currentChatId()) || null
  );

  readonly messages = computed(() => this.currentChat()?.messages || []);

  // API Configuration
  private readonly adminApiUrl = 'https://n8n.omega-studio.tech/webhook/admin-chat';
  private readonly clientApiUrl = 'https://n8n.omega-studio.tech/webhook/client-chat';
  private readonly clientHumanApiUrl = 'https://n8n.omega-studio.tech/webhook/client-chat-directo';
  
  readonly currentApiUrl = computed(() => {
    if (this.currentMode() === 'admin') return this.adminApiUrl;
    return this.isHumanChat() ? this.clientHumanApiUrl : this.clientApiUrl;
  });

  constructor() {
    this.loadHistory();
    
    // Auto-save effect
    effect(() => {
      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem('chat_history', JSON.stringify(this.allHistory()));
      }
    });
  }

  private loadHistory() {
    if (!isPlatformBrowser(this.platformId)) return;

    const saved = localStorage.getItem('chat_history');
    if (saved) {
      try {
        this.allHistory.set(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse chat history', e);
        this.allHistory.set([]);
      }
    }
  }

  switchMode(mode: 'admin' | 'client') {
    this.currentMode.set(mode);
    this.isHumanChat.set(false); // Reset human chat toggle when switching modes
    this.currentChatId.set(null); // Deselect on mode switch
  }

  toggleHumanChat() {
    this.isHumanChat.update(val => !val);
  }

  createNewChat() {
    const newChat: ChatHistoryItem = {
      id: crypto.randomUUID(),
      mode: this.currentMode(),
      title: 'Nueva conversación',
      updatedAt: Date.now(),
      messages: []
    };
    
    this.allHistory.update(history => [newChat, ...history]);
    this.currentChatId.set(newChat.id);
  }

  selectChat(id: string) {
    this.currentChatId.set(id);
  }

  deleteChat(id: string, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    
    this.allHistory.update(history => history.filter(c => c.id !== id));
    if (this.currentChatId() === id) {
      this.currentChatId.set(null);
    }
  }

  sendMessage(content: string) {
    if (!content.trim()) return;

    if (!this.currentChatId()) {
      this.createNewChat();
    }

    const chatId = this.currentChatId()!;
    const userMsg: ChatMessage = { role: 'user', content };

    // Optimistic update
    this.updateChatMessages(chatId, userMsg);
    this.isLoading.set(true);

    const payload = { 
      mensaje: content,
      sessionId: chatId
    };
    
    this.http.post<AgentResponse>(this.currentApiUrl(), payload)
      .pipe(
        map(response => {
          if (typeof response === 'string') return response;
          if (response?.respuesta) return response.respuesta;
          if ((response as any)?.text) return (response as any).text;
          if ((response as any)?.message) return (response as any).message;
          return JSON.stringify(response);
        }),
        tap(output => {
          this.updateChatMessages(chatId, { role: 'assistant', content: output });
        }),
        catchError(err => {
          console.error('Error sending message:', err);
          this.updateChatMessages(chatId, { role: 'system', content: 'Error: Could not connect to the agent.' });
          return of(null);
        }),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe();
  }
  
  private updateChatMessages(chatId: string, newMessage: ChatMessage) {
    this.allHistory.update(history => 
      history.map(chat => {
        if (chat.id === chatId) {
          const updatedMessages = [...chat.messages, newMessage];
          // Auto-generate title from first user message
          let title = chat.title;
          if (chat.messages.length === 0 && newMessage.role === 'user') {
            title = newMessage.content.substring(0, 30) + (newMessage.content.length > 30 ? '...' : '');
          }
          
          return {
            ...chat,
            messages: updatedMessages,
            title,
            updatedAt: Date.now()
          };
        }
        return chat;
      })
    );
  }
}
