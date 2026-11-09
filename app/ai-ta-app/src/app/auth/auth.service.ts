import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface User {
  googleId: string;
  email: string;
  name: string;
  picture: string;
}

const TOKEN_KEY = 'ai-ta-token';

/** Network failure or gateway error — what Render returns while a free service is cold-starting. */
export function isServerAsleep(err: unknown): boolean {
  return (
    err instanceof HttpErrorResponse &&
    (err.status === 0 || err.status === 502 || err.status === 503 || err.status === 504)
  );
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private token = signal<string | null>(localStorage.getItem(TOKEN_KEY));
  currentUser = signal<User | null>(null);
  authChecked = signal(false);
  /** True when the last auth check failed because the server is asleep/unreachable. */
  serverUnavailable = signal(false);
  isAuthenticated = computed(() => !!this.currentUser());

  getToken(): string | null {
    return this.token();
  }

  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
    this.token.set(token);
  }

  private clearToken(): void {
    localStorage.removeItem(TOKEN_KEY);
    this.token.set(null);
  }

  async checkAuth(): Promise<void> {
    if (!this.token()) {
      this.authChecked.set(true);
      return;
    }
    try {
      const user = await firstValueFrom(
        this.http.get<User>(`${environment.apiUrl}/auth/me`),
      );
      this.currentUser.set(user);
      this.serverUnavailable.set(false);
    } catch (err) {
      if (isServerAsleep(err)) {
        // Render free tier spun the API down: keep the token, show the wait page.
        this.serverUnavailable.set(true);
      } else {
        this.clearToken();
        this.currentUser.set(null);
      }
    } finally {
      this.authChecked.set(true);
    }
  }

  login(): void {
    window.location.href = `${environment.apiUrl}/auth/google`;
  }

  async logout(): Promise<void> {
    await firstValueFrom(this.http.post(`${environment.apiUrl}/auth/logout`, {}));
    this.clearToken();
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }
}
