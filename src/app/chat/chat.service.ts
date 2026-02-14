import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, finalize, map, of, tap } from 'rxjs';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AgentResponse {
  respuesta: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private readonly http = inject(HttpClient);

  readonly messages = signal<ChatMessage[]>([]);
  readonly isLoading = signal(false);
  readonly apiUrl = signal('https://n8n.omega-studio.tech/webhook/7b85964a-278d-49ec-b56f-5d71f9415853'); // Default URL

  updateApiUrl(url: string) {
    this.apiUrl.set(url);
  }

  sendMessage(content: string) {
    if (!content.trim()) return;

    this.messages.update(msgs => [...msgs, { role: 'user', content }]);
    this.isLoading.set(true);

    const payload = { input: content }; // Taking a guess on input field, usually 'input' or 'message'
    
    // User requested: "la respuesta devuelva por el agente es un json con un campo llamado output"
    // I will send { message: content } as a common standard, but the prompt didn't specify the REQUEST format, only the RESPONSE.
    // I'll assume a standard JSON body.
    
    this.http.post<AgentResponse>(this.apiUrl(), { message: content })
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
