import { Component, inject, model, effect } from '@angular/core';
import { createExtenderComponent } from '@kompakkt/plugins/extender';
import { KeyValuePipe } from '@angular/common';
import { form, FormField, required } from '@angular/forms/signals';
import { TranslateService } from 'src/app/services/translate.service';

@Component({
  selector: 'app-language-dropdown',
  templateUrl: './language-dropdown.component.html',
  styleUrl: './language-dropdown.component.scss',
  imports: [FormField, KeyValuePipe],
})
export class LanguageDropdownComponent extends createExtenderComponent() {
  #translateService = inject(TranslateService);

  selectedLanguageModel = model('');
  selectedLanguageForm = form(this.selectedLanguageModel, path => {
    required(path);
  });

  languages = this.#translateService.supportedLanguages;

  constructor() {
    super();
    effect(() => {
      const language = this.#translateService.selectedLanguage();
      console.log(language);
      if (language === this.selectedLanguageForm().value()) return;
      this.selectedLanguageForm().value.set(language ?? '');
    });
  }

  changeLanguage(event: Event) {
    const target = event.target as HTMLSelectElement;
    const language = target.value;
    this.#translateService.requestLanguage(language);
  }
}
