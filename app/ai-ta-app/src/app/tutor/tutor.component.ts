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
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { firstValueFrom, map } from 'rxjs';
import { MarkdownComponent } from 'ngx-markdown';
import katex from 'katex';
import { GeminiService, ChatMessage, ChatSession } from '../services/gemini.service';
import { AuthService } from '../auth/auth.service';

(window as any)['katex'] = katex;

const STORAGE_KEY = 'ai-ta-sessions';

@Component({
  selector: 'app-tutor',
  templateUrl: './tutor.component.html',
  styleUrl: './tutor.component.scss',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    MatSidenavModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatMenuModule,
    CdkTextareaAutosize,
    TranslatePipe,
    MarkdownComponent,
  ],
})
export class TutorComponent implements OnInit {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef<HTMLElement>;

  private geminiService = inject(GeminiService);
  authService = inject(AuthService);
  private breakpointObserver = inject(BreakpointObserver);
  private translate = inject(TranslateService);
  private snackBar = inject(MatSnackBar);

  sessions = signal<ChatSession[]>([]);
  currentSessionId = signal<string | null>(null);
  inputValue = signal('');
  isListening = signal(false);
  isLoading = signal(false);
  sidenavOpened = signal(true);

  currentMessages = computed(() => {
    const id = this.currentSessionId();
    return this.sessions().find((s) => s.sessionId === id)?.messages ?? [];
  });

  isMobile = toSignal(
    this.breakpointObserver
      .observe([Breakpoints.Handset])
      .pipe(map((r) => r.matches)),
    { initialValue: false }
  );

  private recognition: any;

  constructor() {
    effect(() => {
      this.currentMessages();
      setTimeout(() => this.scrollToBottom(), 50);
    });

    effect(() => {
      this.sidenavOpened.set(!this.isMobile());
    });
  }

  ngOnInit() {
    this.loadFromStorage();
    this.initSpeechRecognition();
    if (this.sessions().length === 0) {
      this.createNewSession();
    }
  }

  createNewSession() {
    const session: ChatSession = {
      sessionId: crypto.randomUUID(),
      question: this.translate.instant('NEW_SESSION'),
      messages: [],
      createdAt: new Date(),
    };
    this.sessions.update((list) => [session, ...list]);
    this.currentSessionId.set(session.sessionId);
    this.saveToStorage();
    if (this.isMobile()) this.sidenavOpened.set(false);
  }

  selectSession(id: string) {
    this.currentSessionId.set(id);
    if (this.isMobile()) this.sidenavOpened.set(false);
  }

  deleteSession(id: string) {
    const remaining = this.sessions().filter((s) => s.sessionId !== id);
    this.sessions.set(remaining);
    if (this.currentSessionId() === id) {
      this.currentSessionId.set(remaining.length > 0 ? remaining[0].sessionId : null);
      if (remaining.length === 0) this.createNewSession();
    }
    this.saveToStorage();
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
    this.isLoading.set(true);
    this.saveToStorage();

    try {
      const res = await firstValueFrom(this.geminiService.sendMessage(message, sessionId));
      const aiMsg: ChatMessage = {
        role: 'assistant',
        content: res.message,
        timestamp: new Date(),
      };
      this.sessions.update((list) =>
        list.map((s) =>
          s.sessionId === sessionId ? { ...s, messages: [...s.messages, aiMsg] } : s
        )
      );
      this.saveToStorage();
    } catch {
      this.snackBar.open(this.translate.instant('ERROR_API'), 'OK', { duration: 4000 });
    } finally {
      this.isLoading.set(false);
    }
  }

  onEnterKey(event: Event) {
    const ke = event as KeyboardEvent;
    if (!ke.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  toggleMicrophone() {
    if (!this.recognition) {
      this.snackBar.open(this.translate.instant('MICROPHONE_NOT_SUPPORTED'), 'OK', {
        duration: 3000,
      });
      return;
    }
    if (this.isListening()) {
      this.recognition.stop();
    } else {
      try {
        this.recognition.start();
        this.isListening.set(true);
      } catch {
        this.isListening.set(false);
      }
    }
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
    this.recognition.onerror = () => {
      this.isListening.set(false);
      this.snackBar.open(this.translate.instant('ERROR_MICROPHONE'), 'OK', { duration: 3000 });
    };
  }

  logout() {
    this.authService.logout();
  }

  private scrollToBottom() {
    const el = this.messagesContainer?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }

  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.sessions()));
    } catch {}
  }

  private loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed: ChatSession[] = JSON.parse(raw);
      parsed.forEach((s) => {
        s.createdAt = new Date(s.createdAt);
        s.messages.forEach((m) => (m.timestamp = new Date(m.timestamp)));
      });
      this.sessions.set(parsed);
      if (parsed.length > 0) this.currentSessionId.set(parsed[0].sessionId);
    } catch {}
  }
}
