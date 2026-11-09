import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, timeout } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ServerWakeService {
  private http = inject(HttpClient);

  /** True if the API answers its health check within `timeoutMs`. */
  async isAwake(timeoutMs = 5000): Promise<boolean> {
    try {
      await firstValueFrom(
        this.http.get(`${environment.apiUrl}/health`).pipe(timeout(timeoutMs)),
      );
      return true;
    } catch {
      return false;
    }
  }
}
