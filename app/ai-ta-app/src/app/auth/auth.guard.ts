import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.authChecked()) {
    await auth.checkAuth();
  }

  if (auth.serverUnavailable()) {
    auth.authChecked.set(false); // re-check once the server is awake
    return router.createUrlTree(['/khoi-dong']);
  }

  if (auth.isAuthenticated()) return true;
  return router.createUrlTree(['/login']);
};
