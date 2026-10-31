import { Component, effect, input, output, signal, ChangeDetectionStrategy } from '@angular/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from 'src/app/pipes/translate.pipe';

@Component({
  selector: 'app-search-bar',
  imports: [MatIconModule, TranslatePipe, MatAutocompleteModule],
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
