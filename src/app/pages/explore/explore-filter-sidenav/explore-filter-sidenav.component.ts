import {
  Component,
  computed,
  effect,
  inject,
  Injectable,
  input,
  output,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from 'src/app/pipes';
import { SidenavComponent, SidenavService } from 'src/app/services/sidenav.service';
import {
  ExploreFilterOption,
  ExploreFilterOptionComponent,
} from '../explore-filter-option/explore-filter-option.component';
import {
  AccessOptions,
  AnnotationOptions,
  ExploreCategory,
  LicenceOptions,
  MediaTypeOptions,
  MiscOptions,
  SortByOptions,
} from '../shared-types';
import { MatDividerModule } from '@angular/material/divider';

export type ExploreFilterSidenavData = {
  options: ExploreFilterOption[];
  category: ExploreCategory;
};

@Injectable({ providedIn: 'root' })
export class ExploreFilterSidenavOptionsService {
  #selectedOptions = signal<ExploreFilterOption[]>([]);
  selectedOptions = computed(() => this.#selectedOptions());

  #resultCount = signal<number>(0);
  resultCount = computed(() => this.#resultCount());

  public setSelectedOptions(options: ExploreFilterOption[]) {
    this.#selectedOptions.set(options);
  }

  public setResultCount(count: number) {
    this.#resultCount.set(count);
  }
}

@Component({
  selector: 'app-explore-filter-sidenav',
  imports: [
    TranslatePipe,
    ExploreFilterOptionComponent,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
  ],
  templateUrl: './explore-filter-sidenav.component.html',
  styleUrl: './explore-filter-sidenav.component.scss',
})
export class ExploreFilterSidenavComponent implements SidenavComponent {
  #sidenavService = inject(SidenavService);
  service = inject(ExploreFilterSidenavOptionsService);

  title = signal('Filter and sort');
  isHTMLTitle = true;
  dataInput = input<ExploreFilterSidenavData | undefined>(undefined);
  selectedFilterOptions = signal<ExploreFilterOption[]>([]);
  filterOptionsWithoutSortBy = computed(() =>
    this.selectedFilterOptions().filter(option => option.category !== 'sortBy'),
  );
  numFilterOptions = computed(() => this.filterOptionsWithoutSortBy().length);
  category = signal<ExploreCategory>('objects');
  resultChanged = output<ExploreFilterOption[]>();

  constructor() {
    this.resultChanged.emit([]);
    effect(() => {
      const numOptions = this.numFilterOptions();
      if (numOptions > 0) {
        this.title.set(`Filter and sort <div class="option-count-badge">${numOptions}</div>`);
      } else {
        this.title.set('Filter and sort');
      }
    });
    effect(() => {
      const options = this.selectedFilterOptions();
      this.resultChanged.emit(options);
      this.service.setSelectedOptions(options);
    });
    effect(() => {
      const dataInput = this.dataInput();
      if (dataInput) {
        this.selectedFilterOptions.set(dataInput.options);
        this.category.set(dataInput.category);
      }
    });
  }

  public filterOptions = {
    sortBy: SortByOptions,
    mediaType: MediaTypeOptions,
    annotation: AnnotationOptions,
    access: AccessOptions,
    licence: LicenceOptions,
    misc: MiscOptions,
  };

  selectedSortByOption = computed(() => {
    const selectedOptions = this.selectedFilterOptions();
    const selected = selectedOptions.find(option => option.category === 'sortBy');
    if (selected) return [selected];
    const defaultOption = SortByOptions.find(option => option.default);
    return defaultOption ? [defaultOption] : [];
  });

  selectedMediaTypeOptions = computed(() => {
    const selectedOptions = this.selectedFilterOptions();
    return selectedOptions.filter(option => option.category === 'mediaType');
  });

  selectedAnnotationOptions = computed(() => {
    const selectedOptions = this.selectedFilterOptions();
    return selectedOptions.filter(option => option.category === 'annotation');
  });

  selectedAccessOptions = computed(() => {
    const selectedOptions = this.selectedFilterOptions();
    return selectedOptions.filter(option => option.category === 'access');
  });

  selectedLicenceOptions = computed(() => {
    const selectedOptions = this.selectedFilterOptions();
    return selectedOptions.filter(option => option.category === 'licence');
  });

  selectedMiscOptions = computed(() => {
    const selectedOptions = this.selectedFilterOptions();
    return selectedOptions.filter(option => option.category === 'misc');
  });

  public onFilterOptionSelected(
    selectedOptions: ExploreFilterOption[],
    category: ExploreFilterOption['category'],
  ) {
    const currentOptions = this.selectedFilterOptions();
    const updatedOptions = currentOptions.filter(o => o.category !== category);
    this.selectedFilterOptions.set([...updatedOptions, ...selectedOptions]);
  }

  public removeFilterOption(option: ExploreFilterOption) {
    const currentOptions = this.selectedFilterOptions();
    const updatedOptions = currentOptions.filter(o => o.value !== option.value);
    this.selectedFilterOptions.set(updatedOptions);
  }

  public clearAllFilterOptions() {
    const currentOptions = this.selectedFilterOptions();
    this.selectedFilterOptions.set(currentOptions.filter(o => o.category === 'sortBy'));
  }

  public closeSidenav() {
    const currentOptions = this.selectedFilterOptions();
    this.#sidenavService.close(currentOptions);
  }
}
