import { inject, Service } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom, ReplaySubject } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

export type TranslationData = Record<string, string | undefined>;

@Service()
export class TranslateService {
  #http = inject(HttpClient);
  #router = inject(Router);
  #activatedRoute = inject(ActivatedRoute);

  #languageData$ = new BehaviorSubject<TranslationData>({});
  languageData = toSignal(this.#languageData$);
  #selectedLanguage$ = new ReplaySubject<string>(1);
  selectedLanguage = toSignal(this.#selectedLanguage$);
  supportedLanguages = {
    en: 'English',
    de: 'Deutsch (German)',
    fr: 'Français (French)',
    it: 'Italiano (Italian)',
    es: 'Español (Spanish)',
    mn: 'монгол хэл (Mongolian)',
  } as const;

  constructor() {
    this.#selectedLanguage$.subscribe(language => {
      void this.#addLocaleToSearchParams();

      const languageRequestedEvent = new CustomEvent('language-requested', {
        detail: { language },
      });
      document.dispatchEvent(languageRequestedEvent);
    });

    (document as any).addEventListener('language-requested', (event: CustomEvent) => {
      void firstValueFrom(this.#selectedLanguage$).then(currentLanguage => {
        if (currentLanguage === event.detail.language) return;
        this.requestLanguage(event.detail.language);
        console.log('Language requested by event', event.detail);
      });
    });
  }

  async #addLocaleToSearchParams() {
    const locale = await firstValueFrom(this.#selectedLanguage$);
    const windowQueryParams = new URLSearchParams(window.location.search);
    const queryParams = {
      ...Object.fromEntries(windowQueryParams.entries()),
      ...this.#router.currentNavigation()?.extras.state,
      locale: locale,
    };

    return this.#router.navigate([], {
      relativeTo: this.#activatedRoute,
      queryParams: queryParams,
      queryParamsHandling: 'merge',
    });
  }

  public requestLanguage(requestedLanguage?: string) {
    const supportedLanguage = this.getSupportedLanguage(requestedLanguage ?? 'en');
    this.#getTranslationData(supportedLanguage)
      .then(data => {
        console.log('Loaded translation data', { requestedLanguage, supportedLanguage, data });
        this.#languageData$.next(data);
        this.#selectedLanguage$.next(supportedLanguage);
      })
      .catch(err =>
        console.error('Could not load translation data:', {
          requestedLanguage,
          supportedLanguage,
          err,
        }),
      );
  }

  private getSupportedLanguage(requestedLanguage?: string): string {
    const supportedLanguages = Object.keys(this.supportedLanguages);

    const queryLanguage = new URLSearchParams(location.search).get('locale');
    // Remove navigator language detection for now, until translations are more mature
    // const navigatorLanguage = window.navigator.language.split('-').at(0);

    // Find the first supported language or fallback to English
    const supportedLanguage =
      [requestedLanguage, queryLanguage].find(
        language => language && supportedLanguages.includes(language),
      ) ?? 'en';
    return supportedLanguage;
  }

  async #getTranslationData(language: string): Promise<TranslationData> {
    const path = `assets/i18n/${language}.json`;

    try {
      return await firstValueFrom(this.#http.get<TranslationData>(path));
    } catch (e) {
      console.log('Could not load translation', e);
    }
    return {};
  }
}
