import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class TranslateService {
  data: any = {};

  constructor(private http: HttpClient) {}

  // eslint-disable-next-line @typescript-eslint/ban-types
  use(lang: string): Promise<{}> {
    // eslint-disable-next-line @typescript-eslint/ban-types
    return new Promise<{}>((resolve, reject) => {
      const supportedLanguages = ['en', 'de', 'ru', 'mn', 'el', 'it'];

      if (!lang || supportedLanguages.indexOf(lang.toString()) == -1) {
        lang = 'en';
      }
      const langPath = `assets/i18n/${lang}.json`;

      // eslint-disable-next-line @typescript-eslint/ban-types
      this.http.get<{}>(langPath).subscribe(
        translation => {
          this.data = Object.assign({}, translation || {});
          resolve(this.data);
        },
        error => {
          //this.data = {};
          reject(error);
        },
      );
    });
  }

  loadFromFile(translateWords: string | any[]) {
    let lang = window.navigator.language.split('-')[0];
    const supportedLanguages = ['en', 'de', 'ru', 'mn', 'el', 'it'];

    if (!lang || supportedLanguages.indexOf(lang.toString()) == -1) {
      lang = 'en';
    }

    const ISO_Code = lang;
    return new Promise<any>((resolve, reject) => {
      // eslint-disable-next-line @typescript-eslint/ban-types
      this.http.get<{}>(`assets/i18n/${ISO_Code}.json`).subscribe(translations => {
        if (translateWords && translations) {
          const translationsForSet: any[] = [];
          for (let i = 0; i < translateWords.length; i++) {
            translationsForSet[i] = translations[translateWords[i] as keyof typeof translations]; 
          }
          resolve(translationsForSet);
        } else reject([]);
      });
    });
  }
}
