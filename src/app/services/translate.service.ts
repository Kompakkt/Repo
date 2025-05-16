import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom, ReplaySubject } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';

export type TranslationData = Record<string, string | undefined>;

@Injectable()
export class TranslateService {
  private requestedLanguage$ = new BehaviorSubject<string | undefined>(undefined);
  private languageData$ = new BehaviorSubject<TranslationData>({});

  public selectedLanguage$ = new ReplaySubject<string>(1);
  public supportedLanguages = {
    en: 'English',
    de: 'Deutsch (German)',
    fr: 'Français (French)',
    it: 'Italiano (Italian)',
    es: 'Español (Spanish)',
    mn: 'монгол хэл (Mongolian)',
  } as const;

  constructor(
    private http: HttpClient,
    private router: Router,
    private activatedRoute: ActivatedRoute,
  ) {
    this.requestedLanguage$.subscribe(requestedLanguage => {
      const supportedLanguage = this.getSupportedLanguage(requestedLanguage);
      this.getTranslationData(supportedLanguage)
        .then(data => {
          console.log('Loaded translation data', { requestedLanguage, supportedLanguage, data });
          this.languageData$.next(data);
          this.selectedLanguage$.next(supportedLanguage);
        })
        .catch(err =>
          console.error('Could not load translation data:', {
            requestedLanguage,
            supportedLanguage,
            err,
          }),
        );
    });

    this.selectedLanguage$.subscribe(language => {
      this.addLocaleToSearchParams();

      const languageRequestedEvent = new CustomEvent('language-requested', {
        detail: { language },
      });
      document.dispatchEvent(languageRequestedEvent);
    });

    (document as any).addEventListener('language-requested', (event: CustomEvent) => {
      firstValueFrom(this.selectedLanguage$).then(currentLanguage => {
        if (currentLanguage === event.detail.language) return;
        this.requestLanguage(event.detail.language);
        console.log('Language requested by event', event.detail);
      });
    });
  }

  private async addLocaleToSearchParams() {
    const locale = await firstValueFrom(this.selectedLanguage$);
    const queryParams = { ...this.router.getCurrentNavigation()?.extras.state, locale: locale };

    this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: queryParams,
      queryParamsHandling: 'merge',
    });
  }

  public getTranslatedKey(key: string) {
    const translation = this.languageData$.getValue()[key];
    if (!translation) return key;
    return translation;
  }

  public requestLanguage(requestedLanguage?: string) {
    this.requestedLanguage$.next(requestedLanguage);
  }

  private getSupportedLanguage(requestedLanguage?: string): string {
    const supportedLanguages = Object.keys(this.supportedLanguages);

    const queryLanguage = new URLSearchParams(location.search).get('locale');
    const navigatorLanguage = window.navigator.language.split('-').at(0);

    // Find the first supported language or fallback to English
    const supportedLanguage =
      [requestedLanguage, queryLanguage, navigatorLanguage].find(
        language => language && supportedLanguages.includes(language),
      ) ?? 'en';
    return supportedLanguage;
  }

  private async getTranslationData(language: string): Promise<TranslationData> {
    const path = `assets/i18n/${language}.json`;

    try {
      return await firstValueFrom(this.http.get<TranslationData>(path));
    } catch (e) {
      console.log('Could not load translation', e);
    }
    return {};
  }
}
