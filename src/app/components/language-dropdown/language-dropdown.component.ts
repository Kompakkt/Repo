import { Component, inject, OnInit, model } from '@angular/core';
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
export class LanguageDropdownComponent extends createExtenderComponent() implements OnInit {
  #translateService = inject(TranslateService);

  selectedLanguageModel = model('');
  selectedLanguageForm = form(this.selectedLanguageModel, path => {
    required(path);
  });

  languages = this.#translateService.supportedLanguages;

  changeLanguage(event: Event) {
    const target = event.target as HTMLSelectElement;
    const language = target.value;
    this.#translateService.requestLanguage(language);
  }

  ngOnInit(): void {
    this.#translateService.selectedLanguage$.subscribe(language => {
      console.log(language);
      if (language === this.selectedLanguageForm().value()) return;
      this.selectedLanguageForm().value.set(language);
    });
  }
}
