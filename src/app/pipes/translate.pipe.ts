import { inject, Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '../services/translate.service';

@Pipe({ name: 'translate' })
export class TranslatePipe implements PipeTransform {
  #service = inject(TranslateService);
  transform(key: string): string {
    return this.#service.languageData()?.[key] ?? key;
  }
}
