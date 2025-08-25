import { Component, HostBinding, input, output } from '@angular/core';
import { MatAutocompleteModule, MatOption } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from 'src/app/pipes';

export type ExploreFilterOption = {
  label: string;
  value: string;
  exclusive?: boolean;
  default?: boolean;
  category: 'sortBy' | 'filterBy' | 'mediaType' | 'annotation' | 'access' | 'misc' | 'licence';
};

@Component({
  selector: 'app-explore-filter-option',
  imports: [TranslatePipe, MatAutocompleteModule, MatIconModule],
  templateUrl: './explore-filter-option.component.html',
  styleUrl: './explore-filter-option.component.scss',
})
export class ExploreFilterOptionComponent {
  label = input.required<string>();
  placeholder = input.required<string>();
  options = input.required<ExploreFilterOption[]>();

  optionSelected = output<ExploreFilterOption>();

  onOptionSelected(option: MatOption<ExploreFilterOption>) {
    this.optionSelected.emit(option.value);
  }
}
