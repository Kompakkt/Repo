import { KeyValuePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatOption } from '@angular/material/core';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatSelect } from '@angular/material/select';
import { TranslateService } from 'src/app/services';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-language-dropdown',
  templateUrl: './language-dropdown.component.html',
  styleUrls: ['./language-dropdown.component.scss'],
  standalone: true,
  imports: [
    MatFormField,
    MatLabel,
    MatSelect,
    FormsModule,
    ReactiveFormsModule,
    MatOption,
    KeyValuePipe,
    TranslatePipe,
  ],
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
