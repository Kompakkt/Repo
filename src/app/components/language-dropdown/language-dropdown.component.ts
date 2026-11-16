import { Component, inject, model, signal, AfterViewInit } from '@angular/core';
import { createExtenderComponent } from '@kompakkt/plugins/extender';
import { KeyValuePipe } from '@angular/common';
import { form, FormField, required } from '@angular/forms/signals';
import { NgxFluentService } from '@apappas1129/ngx-fluent';
import { languageNames } from 'src/app/app.fluent-sources';

// TODO: Does this need to be an extender component?
@Component({
  selector: 'app-language-dropdown',
  templateUrl: './language-dropdown.component.html',
  styleUrl: './language-dropdown.component.scss',
  imports: [FormField, KeyValuePipe],
})
export class LanguageDropdownComponent extends createExtenderComponent() implements AfterViewInit {
  #fluentService = inject(NgxFluentService);

  selectedLanguageModel = model('');
  selectedLanguageForm = form(this.selectedLanguageModel, path => {
    required(path);
  });

  languages = signal(languageNames);

  changeLanguage(event: Event) {
    const target = event.target as HTMLSelectElement;
    const language = target.value;
    void this.#fluentService.setLocale(language);
  }

  ngAfterViewInit() {
    const locale = this.#fluentService.locale();
    if (locale) this.selectedLanguageForm().value.set(locale);
  }
}
