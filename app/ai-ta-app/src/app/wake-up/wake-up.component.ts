import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService } from '../auth/auth.service';
import { ServerWakeService } from './server-wake.service';

const POLL_MS = 4000;

@Component({
  selector: 'app-wake-up',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <div class="wake-page">
      <div class="wake-card" role="status" aria-live="polite">
        <div class="logo-wrap">
          <img src="/assets/logo/aita_logo.svg" alt="AITA" class="brand-logo" />
        </div>

        <h1>{{ (ready() ? 'WAKE_READY' : 'WAKE_TITLE') | translate }}</h1>
        <p class="sub">{{ 'WAKE_SUB' | translate }}</p>

        @if (!ready()) {
          <div class="dots" aria-hidden="true"><span></span><span></span><span></span></div>
          <p class="step">{{ stepKey() | translate }}</p>
          <p class="tip">{{ 'WAKE_TIP' | translate }}</p>
          <button type="button" class="retry-btn" (click)="check()">
            {{ 'WAKE_RETRY' | translate }}
          </button>
          <p class="why">{{ 'WAKE_WHY' | translate }}</p>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .wake-page {
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
      .wake-card {
        background: var(--phan);
        border: 0.0625rem solid var(--vien);
        border-radius: 1.5rem;
        padding: 2.75rem 2rem 2rem;
        text-align: center;
        box-shadow: var(--do-bong);
        max-width: 26rem;
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
        animation: breathe 2.4s ease-in-out infinite;
      }
      .brand-logo {
        width: 3.25rem;
        height: 3.25rem;
      }
      h1 {
        font-family: 'Lexend', sans-serif;
        font-size: 1.75rem;
        font-weight: 700;
        margin: 0 0 0.75rem;
        color: var(--muc);
      }
      .sub {
        font-size: 1.05rem;
        line-height: 1.6;
        color: var(--muc-nhat);
        margin: 0 0 1.5rem;
      }
      .dots {
        display: flex;
        justify-content: center;
        gap: 0.6rem;
        margin-bottom: 1rem;
      }
      .dots span {
        width: 0.8rem;
        height: 0.8rem;
        border-radius: 50%;
        background: var(--bang);
        animation: bounce 1.2s ease-in-out infinite;
      }
      .dots span:nth-child(2) { animation-delay: 0.15s; }
      .dots span:nth-child(3) { animation-delay: 0.3s; }
      .step {
        font-size: 1.1rem;
        font-weight: 600;
        color: var(--bang-dam);
        margin: 0 0 0.75rem;
      }
      .tip {
        font-size: 1rem;
        line-height: 1.5;
        color: var(--muc);
        background: var(--bang-mo);
        border-radius: 1rem;
        padding: 0.875rem 1rem;
        margin: 0 0 1.25rem;
      }
      .retry-btn {
        min-height: 3.25rem;
        padding: 0.75rem 1.5rem;
        border: 0.125rem solid var(--bang);
        border-radius: 1rem;
        background: transparent;
        color: var(--bang);
        font-size: 1.05rem;
        font-weight: 600;
        cursor: pointer;
      }
      .retry-btn:hover { background: var(--bang-mo); }
      .why {
        font-size: 0.9rem;
        line-height: 1.5;
        color: var(--muc-nhat);
        margin: 1.5rem 0 0;
      }
      @keyframes bounce {
        0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
        40% { transform: translateY(-0.6rem); opacity: 1; }
      }
      @keyframes breathe {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.06); }
      }
      @media (prefers-reduced-motion: reduce) {
        .logo-wrap, .dots span { animation: none; }
      }
    `,
  ],
})
export class WakeUpComponent implements OnInit, OnDestroy {
  private wake = inject(ServerWakeService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private auth = inject(AuthService);

  ready = signal(false);
  private attempts = signal(0);
  private timer?: ReturnType<typeof setTimeout>;
  private checking = false;
  private destroyed = false;

  stepKey = computed(() => {
    const n = this.attempts();
    if (n < 4) return 'WAKE_STEP_1';
    if (n < 12) return 'WAKE_STEP_2';
    return 'WAKE_STEP_3';
  });

  ngOnInit(): void {
    this.check();
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    clearTimeout(this.timer);
  }

  async check(): Promise<void> {
    if (this.checking || this.destroyed) return;
    this.checking = true;
    clearTimeout(this.timer);
    const awake = await this.wake.isAwake(8000);
    this.checking = false;
    if (this.destroyed) return;

    if (!awake) {
      this.attempts.update((n) => n + 1);
      this.timer = setTimeout(() => this.check(), POLL_MS);
      return;
    }

    this.ready.set(true);
    this.auth.serverUnavailable.set(false);
    setTimeout(() => this.proceed(), 800);
  }

  private proceed(): void {
    if (this.destroyed) return;
    if (this.route.snapshot.queryParamMap.get('then') === 'login') {
      this.auth.login();
    } else {
      this.router.navigate(['/']);
    }
  }
}
