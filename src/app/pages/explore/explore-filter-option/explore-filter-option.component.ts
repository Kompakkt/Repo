import {
  AfterViewInit,
  Component,
  computed,
  effect,
  input,
  output,
  viewChild,
} from '@angular/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { MatOption, MatSelect, MatSelectModule } from '@angular/material/select';
import equal from 'fast-deep-equal';
import { map } from 'rxjs';
import { TranslatePipe } from 'src/app/pipes';

const asArray = <T>(value: T | T[]): T[] => (Array.isArray(value) ? value : [value]);

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
export class ExploreFilterOptionComponent implements AfterViewInit {
  label = input.required<string>();
  direction = input<'row' | 'column'>('column');
  placeholder = input.required<string>();
  multiple = input<boolean>(false);
  nullable = input<boolean>(false);
  options = input.required<ExploreFilterOption[]>();
  selectedOptions = input<ExploreFilterOption[]>([]);
  optionSelected = output<ExploreFilterOption[]>();

  computedOptions = computed(() => {});

  readonly selectEl = viewChild.required<MatSelect>('selectEl');

  constructor() {
    effect(() => {
      const multiple = this.multiple();
      const selectedOptions = this.selectedOptions();
      const selectEl = this.selectEl();

      const previous =
        asArray(selectEl.selected)
          ?.filter((o): o is MatOption<ExploreFilterOption> => !!o?.value)
          .map(o => o.value) ?? [];
      const isEqual = equal(previous, selectedOptions);

      if (isEqual) return;
      requestIdleCallback(() => {
        if (selectedOptions.length > 0) {
          selectEl.writeValue(multiple ? selectedOptions : selectedOptions.at(0));
        } else {
          selectEl.writeValue(undefined);
        }
      });
    });
  }

  ngAfterViewInit() {
    this.selectEl()
      .optionSelectionChanges.pipe(
        map(
          () =>
            this.selectEl().selected as
              | MatOption<ExploreFilterOption>
              | MatOption<ExploreFilterOption>[]
              | null,
        ),
        map(selected => (Array.isArray(selected) ? selected : [selected])),
        map(options => options.map(o => o?.value ?? null)),
      )
      .subscribe(current => {
        const firstCurrent = current.at(0);
        const multiple = this.multiple();
        const isSingleDefault = !multiple && firstCurrent?.default === true;

        // If single select and default option is selected, emit empty array
        if (isSingleDefault) {
          this.optionSelected.emit([]);
          return;
        }

        // If nullable and nothing is selected, emit empty array
        if (!firstCurrent) {
          this.optionSelected.emit([]);
        }

        this.optionSelected.emit(current.filter((v): v is ExploreFilterOption => !!v));

        requestAnimationFrame(() => {
          this.selectEl()['_overlayDir'].overlayRef?.updatePosition();
        });
      });
  }
}
