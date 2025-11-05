import { Component, input, output } from '@angular/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
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
  imports: [TranslatePipe, MatAutocompleteModule, MatIconModule, MatSelectModule],
  templateUrl: './explore-filter-option.component.html',
  styleUrl: './explore-filter-option.component.scss',
  host: {
    '[class.row]': 'direction() === "row"',
  },
})
export class ExploreFilterOptionComponent {
  label = input.required<string>();
  direction = input<'row' | 'column'>('column');
  placeholder = input.required<string>();
  multiple = input<boolean>(false);
  options = input.required<ExploreFilterOption[]>();
  selectedOptions = input<ExploreFilterOption[]>([]);
  optionSelected = output<ExploreFilterOption[]>();

  onOptionSelected(event: MatSelectChange<ExploreFilterOption | ExploreFilterOption[]>) {
    this.optionSelected.emit(Array.isArray(event.value) ? event.value : [event.value]);
  }
}
