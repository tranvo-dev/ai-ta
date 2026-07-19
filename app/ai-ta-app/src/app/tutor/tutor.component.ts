import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  computed,
  signal,
  effect,
  inject,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { TranslatePipe } from '@ngx-translate/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { firstValueFrom, map } from 'rxjs';
import { MarkdownComponent } from 'ngx-markdown';
import katex from 'katex';
import { GeminiService, ChatMessage, ChatSession } from '../services/gemini.service';
import { AuthService } from '../auth/auth.service';

(window as any)['katex'] = katex;

@Component({
  selector: 'app-tutor',
  templateUrl: './tutor.component.html',
  styleUrl: './tutor.component.scss',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    MatSidenavModule,
    MatIconModule,
    TranslatePipe,
    MarkdownComponent,
  ],
})
export class TutorComponent implements OnInit {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef<HTMLElement>;

  private geminiService = inject(GeminiService);
  authService = inject(AuthService);
  private breakpointObserver = inject(BreakpointObserver);

  sessions = signal<ChatSession[]>([]);
  currentSessionId = signal<string | null>(null);
  inputValue = signal('');
  isListening = signal(false);
  isLoading = signal(false);
  historyOpened = signal(false);
  pendingDeleteId = signal<string | null>(null);

  /** Composing takes over the whole screen as soon as she speaks or types. */
  composeExpanded = computed(() => this.isListening() || this.inputValue().trim().length > 0);

  private loadedSessionIds = new Set<string>();

  currentMessages = computed(() => {
    const id = this.currentSessionId();
    return this.sessions().find((s) => s.sessionId === id)?.messages ?? [];
  });

  isMobile = toSignal(
    this.breakpointObserver
      .observe([Breakpoints.Handset, Breakpoints.TabletPortrait])
      .pipe(map((r) => r.matches)),
    { initialValue: false }
  );

  private recognition: any;

  constructor() {
    effect(() => {
      this.currentMessages();
      setTimeout(() => this.scrollToBottom(), 50);
    });
  }

  async ngOnInit() {
    this.initSpeechRecognition();
    await this.loadSessions();
  }

  private async loadSessions() {
    try {
      const list = await firstValueFrom(this.geminiService.getSessions());
      this.sessions.set(
        list.map((s) => ({
          sessionId: s.id,
          question: s.title,
          messages: [],
          createdAt: new Date(s.createdAt),
        }))
      );
      if (list.length > 0) {
        this.currentSessionId.set(list[0].id);
        await this.loadMessages(list[0].id);
      } else {
        await this.createNewSession();
      }
    } catch {
      this.currentSessionId.set(null);
    }
  }

  private async loadMessages(sessionId: string) {
    if (this.loadedSessionIds.has(sessionId)) return;
    try {
      const msgs = await firstValueFrom(this.geminiService.getMessages(sessionId));
      this.sessions.update((list) =>
        list.map((s) =>
          s.sessionId === sessionId
            ? {
                ...s,
                messages: msgs.map((m) => ({
                  role: m.role as 'user' | 'assistant',
                  content: m.content,
                  timestamp: new Date(m.createdAt),
                })),
              }
            : s
        )
      );
      this.loadedSessionIds.add(sessionId);
    } catch {}
  }

  async createNewSession() {
    this.inputValue.set('');
    const emptySession = this.sessions().find((s) => s.messages.length === 0);
    if (emptySession) {
      this.currentSessionId.set(emptySession.sessionId);
      this.historyOpened.set(false);
      return;
    }
    try {
      const s = await firstValueFrom(this.geminiService.createSession());
      const session: ChatSession = {
        sessionId: s.id,
        question: s.title,
        messages: [],
        createdAt: new Date(s.createdAt),
      };
      this.sessions.update((list) => [session, ...list]);
      this.currentSessionId.set(s.id);
      this.loadedSessionIds.add(s.id);
      this.historyOpened.set(false);
    } catch {}
  }

  async selectSession(id: string) {
    this.currentSessionId.set(id);
    await this.loadMessages(id);
    this.historyOpened.set(false);
  }

  askDelete(id: string) {
    this.pendingDeleteId.set(id);
  }

  cancelDelete() {
    this.pendingDeleteId.set(null);
  }

  async confirmDelete(id: string) {
    this.pendingDeleteId.set(null);
    try {
      await firstValueFrom(this.geminiService.deleteSession(id));
      this.loadedSessionIds.delete(id);
      const remaining = this.sessions().filter((s) => s.sessionId !== id);
      this.sessions.set(remaining);
      if (this.currentSessionId() === id) {
        if (remaining.length > 0) {
          this.currentSessionId.set(remaining[0].sessionId);
          await this.loadMessages(remaining[0].sessionId);
        } else {
          await this.createNewSession();
        }
      }
    } catch {}
  }

  async sendMessage() {
    const message = this.inputValue().trim();
    const sessionId = this.currentSessionId();
    if (!message || !sessionId || this.isLoading()) return;

    const isFirst = this.currentMessages().length === 0;
    const userMsg: ChatMessage = { role: 'user', content: message, timestamp: new Date() };

    this.sessions.update((list) =>
      list.map((s) =>
        s.sessionId === sessionId
          ? {
              ...s,
              messages: [...s.messages, userMsg],
              ...(isFirst && { question: message.slice(0, 60) }),
            }
          : s
      )
    );

    this.inputValue.set('');
    await this.requestAnswer(sessionId, message);
  }

  /** Retry a question that failed to send. */
  async retry(content: string) {
    const sessionId = this.currentSessionId();
    if (!sessionId || this.isLoading()) return;
    await this.requestAnswer(sessionId, content);
  }

  private async requestAnswer(sessionId: string, content: string) {
    this.isLoading.set(true);
    try {
      const res = await firstValueFrom(this.geminiService.sendMessage(content, sessionId));
      const aiMsg: ChatMessage = { role: 'assistant', content: res.message, timestamp: new Date() };
      // success — clear any error flag and append the answer
      this.sessions.update((list) =>
        list.map((s) =>
          s.sessionId === sessionId
            ? {
                ...s,
                messages: [
                  ...s.messages.map((m) => (m.error ? { ...m, error: false } : m)),
                  aiMsg,
                ],
              }
            : s
        )
      );
    } catch {
      // failure — flag the most recent question so the chat shows a retry box
      this.sessions.update((list) =>
        list.map((s) => (s.sessionId === sessionId ? { ...s, messages: this.flagLastQuestion(s.messages) } : s))
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  private flagLastQuestion(messages: ChatMessage[]): ChatMessage[] {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        const copy = [...messages];
        copy[i] = { ...copy[i], error: true };
        return copy;
      }
    }
    return messages;
  }

  onEnterKey(event: Event) {
    const ke = event as KeyboardEvent;
    if (!ke.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  toggleMicrophone() {
    if (!this.recognition) return;
    if (this.isListening()) {
      this.recognition.stop();
    } else {
      try {
        this.inputValue.set('');
        this.recognition.start();
        this.isListening.set(true);
      } catch {
        this.isListening.set(false);
      }
    }
  }

  logout() {
    this.authService.logout();
  }

  private initSpeechRecognition() {
    const SR =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    this.recognition = new SR();
    this.recognition.lang = 'vi-VN';
    this.recognition.continuous = false;
    this.recognition.interimResults = true;

    this.recognition.onresult = (e: any) => {
      const text = Array.from(e.results as any[])
        .map((r: any) => r[0].transcript)
        .join('');
      this.inputValue.set(text);
    };
    this.recognition.onend = () => this.isListening.set(false);
    this.recognition.onerror = () => this.isListening.set(false);
  }

  private scrollToBottom() {
    const el = this.messagesContainer?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }
}
