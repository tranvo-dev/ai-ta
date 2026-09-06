import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideAppInitializer, inject } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './auth/auth.interceptor';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { KATEX_OPTIONS, provideMarkdown } from 'ngx-markdown';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideTranslateService({ lang: 'vi' }),
    ...provideTranslateHttpLoader({ prefix: '/assets/i18n/', suffix: '.json' }),
    provideAppInitializer(() => inject(TranslateService).use('vi')),
    provideMarkdown(),
    {
      // throwOnError: a single unsupported command would otherwise reject the whole
      // parse and leave the message bubble empty. nonStandard: let `$x$` be
      // recognised when it hugs punctuation, e.g. "($x^2$)". strict: Gemini
      // writes Vietnamese inside \text{}, which KaTeX renders but warns about.
      provide: KATEX_OPTIONS,
      useValue: { throwOnError: false, nonStandard: true, strict: 'ignore' },
    },
  ],
};
