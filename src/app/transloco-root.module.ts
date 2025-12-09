import { HttpClient } from '@angular/common/http';
import { Injectable, NgModule } from '@angular/core';
import { environment } from '@environments/environment';
import { TRANSLOCO_LOADER, Translation, TranslocoLoader, TRANSLOCO_CONFIG, translocoConfig, TranslocoModule, TRANSLOCO_TRANSPILER, TRANSLOCO_MISSING_HANDLER, TRANSLOCO_INTERCEPTOR, TRANSLOCO_FALLBACK_STRATEGY, DefaultInterceptor, DefaultFallbackStrategy } from '@jsverse/transloco';
import { MessageFormatTranspiler } from '@jsverse/transloco-messageformat';
import type { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TranslocoHttpLoader implements TranslocoLoader {
  public constructor(private readonly http: HttpClient) {}

  public getTranslation(lang: string): Observable<Translation> {
    return this.http.get<Translation>(`/assets/i18n/${lang}.json`);
  }
}

@NgModule({
  exports: [TranslocoModule],
  providers: [
    {
      provide: TRANSLOCO_CONFIG,
      useValue: translocoConfig({
        availableLangs: ['en'],
        defaultLang: 'en',
        fallbackLang: 'en',
        failedRetries: 3,
        reRenderOnLangChange: true,
        prodMode: environment.production,
        flatten: {
          aot: environment.production,
        },
      }),
    },
    {
      provide: TRANSLOCO_MISSING_HANDLER,
      useValue: { handle: () => '' },
    },
    {
      provide: TRANSLOCO_INTERCEPTOR,
      useClass: DefaultInterceptor
    },
    {
      provide: TRANSLOCO_FALLBACK_STRATEGY,
      useClass: DefaultFallbackStrategy,
      deps: [TRANSLOCO_CONFIG]
    },
    { provide: TRANSLOCO_TRANSPILER, useClass: MessageFormatTranspiler},
    { provide: TRANSLOCO_LOADER, useClass: TranslocoHttpLoader },
  ],
})
export class TranslocoRootModule {}
