import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatSession {
  sessionId: string;
  question: string;
  messages: ChatMessage[];
  createdAt: Date;
}

@Injectable({ providedIn: 'root' })
export class GeminiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  sendMessage(message: string, sessionId: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(this.apiUrl, { message, sessionId });
  }
}
