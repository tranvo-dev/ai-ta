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

interface SessionSummary {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

interface ApiMessage {
  id: string;
  role: string;
  content: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class GeminiService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  sendMessage(message: string, sessionId: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(this.api, { message, sessionId });
  }

  getSessions(): Observable<SessionSummary[]> {
    return this.http.get<SessionSummary[]>(`${this.api}/sessions`);
  }

  createSession(): Observable<SessionSummary> {
    return this.http.post<SessionSummary>(`${this.api}/sessions`, {});
  }

  getMessages(sessionId: string): Observable<ApiMessage[]> {
    return this.http.get<ApiMessage[]>(`${this.api}/sessions/${sessionId}/messages`);
  }

  deleteSession(sessionId: string): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${this.api}/sessions/${sessionId}`);
  }
}
