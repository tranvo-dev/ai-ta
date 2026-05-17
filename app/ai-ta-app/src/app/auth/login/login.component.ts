import { Component, inject } from '@angular/core';
import { AuthService } from '../auth.service';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <div class="login-container">
      <div class="login-card">
        
        <img src="/assets/logo/aita_logo.svg" alt="AI-TA Logo" class="brand-logo" />
        <h1>{{ 'APP_TITLE' | translate }}</h1>
        <p>{{'APP_SUBTITLE' | translate}}</p>
        <button (click)="auth.login()" class="google-btn">
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
          Đăng nhập với Google
        </button>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      background: #f5f5f5;
    }
    .login-card {
      background: white;
      border-radius: 12px;
      padding: 48px;
      text-align: center;
      box-shadow: 0 4px 24px rgba(0,0,0,0.1);
      max-width: 360px;
      width: 100%;
    }
    .brand-logo { width: 64px; height: 64px; margin: 0 0 16px; }
    h1 { font-size: 2rem; margin: 0 0 8px; color: #1a73e8; }
    p { color: #666; margin: 0 0 32px; }
    .google-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      width: 100%;
      padding: 12px 24px;
      border: 1px solid #ddd;
      border-radius: 8px;
      background: white;
      cursor: pointer;
      font-size: 16px;
      transition: background 0.2s;
    }
    .google-btn:hover { background: #f8f8f8; }
    .google-btn img { width: 20px; height: 20px; }
  `],
})
export class LoginComponent {
  auth = inject(AuthService);
}
