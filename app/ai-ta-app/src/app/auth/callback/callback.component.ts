import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  template: `<div style="display:flex;align-items:center;justify-content:center;height:100vh">Đang đăng nhập...</div>`,
})
export class AuthCallbackComponent implements OnInit {
  private router = inject(Router);
  private authService = inject(AuthService);

  ngOnInit() {
    const hash = window.location.hash.slice(1);
    const params = new URLSearchParams(hash);
    const token = params.get('token');
    if (token) {
      this.authService.setToken(token);
    }
    this.router.navigate(['/']);
  }
}
