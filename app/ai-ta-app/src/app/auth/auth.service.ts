import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface User {
  googleId: string;
  email: string;
  name: string;
  picture: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  currentUser = signal<User | null>(null);
  authChecked = signal(false);
  isAuthenticated = computed(() => !!this.currentUser());

  async checkAuth(): Promise<void> {
    try {
      const user = await firstValueFrom(
        this.http.get<User>(`${environment.apiUrl}/auth/me`),
      );
      this.currentUser.set(user);
    } catch {
      this.currentUser.set(null);
    } finally {
      this.authChecked.set(true);
    }
  }

  login(): void {
    window.location.href = `${environment.apiUrl}/auth/google`;
  }

  async logout(): Promise<void> {
    await firstValueFrom(this.http.post(`${environment.apiUrl}/auth/logout`, {}));
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }
}
