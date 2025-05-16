import { Component, inject, OnInit } from '@angular/core';
import { createExtenderComponent } from '@kompakkt/extender';
import { FormControl } from '@angular/forms';
import { KeyValuePipe } from '@angular/common';
import { TranslateService } from 'src/app/services';

@Component({
  selector: 'app-language-dropdown',
  templateUrl: './language-dropdown.component.html',
  styleUrl: './language-dropdown.component.scss',
  imports: [KeyValuePipe],
})
export class LanguageDropdownComponent extends createExtenderComponent() implements OnInit {
  #translateService = inject(TranslateService);

  selectedLanguage = new FormControl<string>('', { nonNullable: true });

  languages = this.#translateService.supportedLanguages;

  changeLanguage(event: Event) {
    const target = event.target as HTMLSelectElement;
    const language = target.value;
    this.#translateService.requestLanguage(language);
  }

  ngOnInit(): void {
    this.#translateService.selectedLanguage$.subscribe(language => {
      console.log(language);
      if (language === this.selectedLanguage.value) return;
      this.selectedLanguage.setValue(language);
    });
  }
}
