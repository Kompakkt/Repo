import { Component, computed, effect, input, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from 'src/app/pipes';
import { SidenavComponent } from 'src/app/services/sidenav.service';
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

export type ExploreFilterSidenavData = {
  options: ExploreFilterOption[];
  category: ExploreCategory;
};

@Component({
  selector: 'app-explore-filter-sidenav',
  imports: [TranslatePipe, ExploreFilterOptionComponent, MatIconModule, MatButtonModule],
  templateUrl: './explore-filter-sidenav.component.html',
  styleUrl: './explore-filter-sidenav.component.scss',
})
export class ExploreFilterSidenavComponent implements SidenavComponent {
  title = 'Filter and sort';
  dataInput = input<ExploreFilterSidenavData | undefined>(undefined);
  selectedFilterOptions = signal<ExploreFilterOption[]>([]);
  numFilterOptions = computed(() => this.selectedFilterOptions().length);
  category = signal<ExploreCategory>('objects');
  resultChanged = output<ExploreFilterOption[]>();

  constructor() {
    this.resultChanged.emit([]);
    effect(() => {
      const options = this.selectedFilterOptions();
      this.resultChanged.emit(options);
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

  public onFilterOptionSelected(option: ExploreFilterOption) {
    const currentOptions = this.selectedFilterOptions();
    const updatedOptions = option.exclusive
      ? currentOptions.filter(o => o.category !== option.category).concat(option)
      : currentOptions.concat(option);
    this.selectedFilterOptions.set(updatedOptions);
  }

  public removeFilterOption(option: ExploreFilterOption) {
    const currentOptions = this.selectedFilterOptions();
    const updatedOptions = currentOptions.filter(o => o.value !== option.value);
    this.selectedFilterOptions.set(updatedOptions);
  }

  public clearAllFilterOptions() {
    this.selectedFilterOptions.set([]);
  }
}
