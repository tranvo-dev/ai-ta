import { Component, inject } from '@angular/core';
import { AuthService } from '../auth.service';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <div class="login-page">
      <div class="login-card">
        <div class="logo-wrap">
          <img src="/assets/logo/aita_logo.svg" alt="AITA" class="brand-logo" />
        </div>

        <h1>{{ 'WELCOME_TITLE' | translate }}</h1>
        <p class="welcome-sub">{{ 'WELCOME_SUB' | translate }}</p>

        <button (click)="auth.login()" class="google-btn" type="button">
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt=""
            aria-hidden="true" />
          <span>{{ 'LOGIN_BUTTON' | translate }}</span>
        </button>

        <p class="reassure">{{ 'LOGIN_REASSURE' | translate }}</p>
      </div>
    </div>
  `,
  styles: [
    `
      .login-page {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        min-height: 100dvh;
        padding: 1.5rem;
        background-color: var(--giay);
        background-image:
          linear-gradient(var(--oly) 0.0625rem, transparent 0.0625rem),
          linear-gradient(90deg, var(--oly) 0.0625rem, transparent 0.0625rem);
        background-size: 1.4rem 1.4rem;
      }

      .login-card {
        background: var(--phan);
        border: 0.0625rem solid var(--vien);
        border-radius: 1.5rem;
        padding: 2.75rem 2rem 2.25rem;
        text-align: center;
        box-shadow: var(--do-bong);
        max-width: 24rem;
        width: 100%;
      }

      .logo-wrap {
        width: 5.5rem;
        height: 5.5rem;
        margin: 0 auto 1.5rem;
        border-radius: 1.25rem;
        background: var(--bang-mo);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .brand-logo {
        width: 3.25rem;
        height: 3.25rem;
      }

      h1 {
        font-family: 'Lexend', sans-serif;
        font-size: 1.9rem;
        font-weight: 700;
        margin: 0 0 0.75rem;
        color: var(--muc);
        letter-spacing: -0.01em;
      }

      .welcome-sub {
        font-size: 1.05rem;
        line-height: 1.6;
        color: var(--muc-nhat);
        margin: 0 0 2rem;
      }

      .google-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.875rem;
        width: 100%;
        min-height: 3.75rem;
        padding: 0.875rem 1.25rem;
        border: 0.125rem solid var(--bang);
        border-radius: 1rem;
        background: var(--bang);
        color: var(--phan);
        cursor: pointer;
        font-size: 1.15rem;
        font-weight: 600;
        transition: background 0.2s, transform 0.1s;
      }

      .google-btn:hover {
        background: var(--bang-dam);
      }

      .google-btn:active {
        transform: scale(0.99);
      }

      .google-btn img {
        width: 1.6rem;
        height: 1.6rem;
        background: #fff;
        border-radius: 0.35rem;
        padding: 0.15rem;
      }

      .reassure {
        font-size: 0.95rem;
        color: var(--muc-nhat);
        margin: 1.25rem 0 0;
      }
    `,
  ],
})
export class LoginComponent {
  auth = inject(AuthService);
}
