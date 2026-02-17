import { Injectable, inject, signal, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Firestore, collection, onSnapshot, Unsubscribe } from '@angular/fire/firestore';
import { catchError, finalize, map, of, tap } from 'rxjs';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AgentResponse {
  respuesta: string;
}

@Injectable()
export class ChatService implements OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly firestore = inject(Firestore);
  
  private unsubscribe: Unsubscribe | null = null;

  readonly sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  readonly messages = signal<ChatMessage[]>([]);
  readonly isLoading = signal(false);
  readonly apiUrl = signal('https://n8n.omega-studio.tech/webhook/7b85964a-278d-49ec-b56f-5d71f9415853'); // Default URL

  constructor() {
    // this.listenToNotifications();
  }

  enableAdminNotifications() {
    this.listenToNotifications();
  }

  private listenToNotifications() {
    const notificationsCollection = collection(this.firestore, 'notifications_example');
    
    this.unsubscribe = onSnapshot(notificationsCollection, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          // The user specified the format as { "mensaje:" "Mensaje del ususario" }
          // It's ambiguous if the key is "mensaje" or "mensaje:"
          // I'll check both just in case, but assume "mensaje" is the intended key.
          const msg = data['mensaje'] || data['mensaje:'];
          
          if (msg) { 
            this.messages.update(msgs => [...msgs, { role: 'assistant', content: msg }]);
          }
        }
      });
    }, (error) => {
      console.error('Error listening to modifications:', error);
    });
  }

  ngOnDestroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  updateApiUrl(url: string) {
    this.apiUrl.set(url);
  }

  sendMessage(content: string) {
    if (!content.trim()) return;

    this.messages.update(msgs => [...msgs, { role: 'user', content }]);
    this.isLoading.set(true);

    const payload = { 
      mensaje: content,
      sessionId: this.sessionId
    };
    
    this.http.post<AgentResponse>(this.apiUrl(), payload)
      .pipe(
        map(response => response.respuesta),
        tap(output => {
          this.messages.update(msgs => [...msgs, { role: 'assistant', content: output }]);
        }),
        catchError(err => {
          console.error('Error sending message:', err);
          this.messages.update(msgs => [...msgs, { role: 'system', content: 'Error: Could not connect to the agent.' }]);
          return of(null);
        }),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe();
  }

  clearChat() {
    this.messages.set([]);
  }
}
