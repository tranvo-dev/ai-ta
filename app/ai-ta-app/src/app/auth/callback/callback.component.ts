import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  template: `<div style="display:flex;align-items:center;justify-content:center;height:100vh">Đang đăng nhập...</div>`,
})
export class AuthCallbackComponent implements OnInit {
  private router = inject(Router);

  ngOnInit() {
    this.router.navigate(['/']);
  }
}
