import { Component, OnInit } from '@angular/core';
import { TranslateService } from '~services';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-language-dropdown',
  templateUrl: './language-dropdown.component.html',
  styleUrls: ['./language-dropdown.component.scss'],
})
export class LanguageDropdownComponent implements OnInit {
  public selectedLanguage = new FormControl<string>('', { nonNullable: true });

  constructor(private translateService: TranslateService) {}

  get languages() {
    return this.translateService.supportedLanguages;
  }

  ngOnInit(): void {
    this.translateService.selectedLanguage$.subscribe(language => {
      if (language === this.selectedLanguage.value) return;
      this.selectedLanguage.setValue(language);
    });

    this.selectedLanguage.valueChanges.subscribe(language =>
      this.translateService.requestLanguage(language),
    );
  }
}
