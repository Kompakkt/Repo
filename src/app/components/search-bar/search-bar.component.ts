import { Component, effect, input, output, signal, ChangeDetectionStrategy } from '@angular/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { NgxFluentPipe } from '@apappas1129/ngx-fluent';

@Component({
  selector: 'app-search-bar',
  imports: [MatIconModule, NgxFluentPipe, MatAutocompleteModule],
  templateUrl: './search-bar.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './search-bar.component.scss',
})
export class SearchBarComponent {
  suggestions = input<string[]>([]);
  popularSuggestions = input<string[]>([]);
  initialValue = input<string>('');
  searchText = signal<string>('');

  searchTextChanged = output<string>();

  constructor() {
    let setInitialRef = effect(() => {
      this.searchText.set(this.initialValue());
      setInitialRef.destroy();
    });

    effect(() => {
      this.searchTextChanged.emit(this.searchText());
    });
  }
}
