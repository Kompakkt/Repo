import {
  Component,
  computed,
  effect,
  ElementRef,
  input,
  output,
  viewChild,
  viewChildren,
} from '@angular/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatCheckbox, MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioChange, MatRadioGroup, MatRadioModule } from '@angular/material/radio';
import equal from 'fast-deep-equal';
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
  imports: [
    TranslatePipe,
    MatAutocompleteModule,
    MatIconModule,
    MatExpansionModule,
    MatRadioModule,
    MatCheckboxModule,
  ],
  templateUrl: './explore-filter-option.component.html',
  styleUrl: './explore-filter-option.component.scss',
})
export class ExploreFilterOptionComponent {
  label = input.required<string>();
  multiple = input<boolean>(false);
  options = input.required<ExploreFilterOption[]>();
  selectedOptions = input<ExploreFilterOption[]>([]);
  optionSelected = output<ExploreFilterOption[]>();

  extraLabel = computed(() => {
    const multiple = this.multiple();
    const selectedOptions = this.selectedOptions();
    if (selectedOptions.length === 0) return null;
    return multiple ? selectedOptions.length : selectedOptions[0].label;
  });

  readonly checkboxEls = viewChildren<MatCheckbox>('checkboxEl');
  readonly radioGroupEl = viewChild<ElementRef<MatRadioGroup>>('radioGroupEl');

  constructor() {
    effect(() => {
      const options = this.options();
      const selectedOptions = this.selectedOptions();
      const radioGroupEl = this.radioGroupEl();
      const checkboxEls = this.checkboxEls();

      const previous = (() => {
        if (radioGroupEl) {
          return radioGroupEl.nativeElement.selected
            ? [radioGroupEl.nativeElement.selected.value as ExploreFilterOption]
            : [];
        } else {
          return checkboxEls
            .map(c => options.find(o => o.value === c.value))
            .filter((v): v is ExploreFilterOption => !!v);
        }
      })();

      const isEqual = equal(previous, selectedOptions);

      if (isEqual) return;
      requestIdleCallback(() => {
        if (selectedOptions.length > 0) {
          if (radioGroupEl) {
            radioGroupEl.nativeElement.value = selectedOptions.at(0) ?? undefined;
          } else {
            checkboxEls.forEach(checkbox => {
              const isSelected = selectedOptions.some(option => option.value === checkbox.value);
              checkbox.checked = isSelected;
            });
          }
        } else {
          if (radioGroupEl) {
            radioGroupEl.nativeElement.value = undefined;
          } else {
            checkboxEls.forEach(checkbox => {
              checkbox.checked = false;
            });
          }
        }
      });
    });
  }

  onCheckboxChange(event: MatCheckboxChange) {
    const checkboxes = this.checkboxEls();
    const checkedOptions = checkboxes
      .filter(c => c.checked)
      .map(c => this.options().find(o => o.value === c.value))
      .filter((v): v is ExploreFilterOption => !!v);
    this.#handleOptionChange(checkedOptions);
  }

  onRadioChange(event: MatRadioChange<ExploreFilterOption | null>) {
    const selectedOption = event.value;
    this.#handleOptionChange(selectedOption ? [selectedOption] : []);
  }

  #handleOptionChange(active: ExploreFilterOption[]) {
    console.log(active);
    const firstActive = active.at(0);
    const multiple = this.multiple();
    const isSingleDefault = !multiple && firstActive?.default === true;

    // If single select and default option is selected, emit empty array
    if (isSingleDefault) {
      this.optionSelected.emit([]);
      return;
    }

    // If nullable and nothing is selected, emit empty array
    if (!firstActive) {
      this.optionSelected.emit([]);
    }

    this.optionSelected.emit(active.filter((v): v is ExploreFilterOption => !!v));
  }
}
