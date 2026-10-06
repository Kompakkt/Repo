import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { type ICompilation, type IEntity, type IPublicProfile } from '@kompakkt/common';
import { GridElementComponent } from 'src/app/components';
import { SearchBarComponent } from 'src/app/components/search-bar/search-bar.component';
import { Tab, TabsComponent } from 'src/app/components/tabs/tabs.component';
import { TranslatePipe } from 'src/app/pipes';
import { AccountService, BackendService, DialogHelperService } from 'src/app/services';
import { SidenavService } from 'src/app/services/sidenav.service';
import { ExploreFilterOption } from '../../explore/explore-filter-option/explore-filter-option.component';
import { ExploreFilterSidenavToggleComponent } from '../../explore/explore-filter-sidenav-toggle/explore-filter-sidenav-toggle.component';
import {
  ExploreFilterSidenavComponent,
  ExploreFilterSidenavData,
  ExploreFilterSidenavOptionsService,
} from '../../explore/explore-filter-sidenav/explore-filter-sidenav.component';
import {
  AnnotationOptions,
  ExploreCategory,
  LicenceOptions,
  MediaTypeOptions,
  MiscOptions,
  reduceExploreFilterOptions,
  SortByOptions,
  SortOrder,
} from '../../explore/shared-types';
import { ProfilePageHeaderComponent } from '../profile-page-header/profile-page-header.component';

type FilterableProfileItem = {
  name: string;
  __normalizedName?: string;
  __hits?: number;
  __createdAt?: number;
  __annotationCount?: number;
  __licenses?: string[];
  __mediaTypes?: string[];
  __downloadable?: boolean;
  annotations?: Record<string, unknown>;
  mediaType?: string;
};

@Component({
  selector: 'app-profile-public-view',
  templateUrl: './profile-public-view.component.html',
  styleUrls: ['./profile-public-view.component.scss'],
  standalone: true,
  imports: [
    MatIconModule,
    MatTooltipModule,
    TranslatePipe,
    GridElementComponent,
    ProfilePageHeaderComponent,
    SearchBarComponent,
    TabsComponent,
    ExploreFilterSidenavToggleComponent,
  ],
})
export class ProfilePublicViewComponent {
  #backend = inject(BackendService);
  #account = inject(AccountService);
  #helper = inject(DialogHelperService);
  #sidenavService = inject(SidenavService);
  #sidenavOptionsService = inject(ExploreFilterSidenavOptionsService);

  profile = input.required<IPublicProfile>();

  entities = signal<IEntity[]>([]);
  compilations = signal<ICompilation[]>([]);

  searchText = signal('');
  selectedTab = signal<string>('objects');

  selectedFilterOptions = signal<ExploreFilterOption[]>([]);
  numFilterOptions = computed(
    () => this.selectedFilterOptions().filter(option => option.category !== 'sortBy').length,
  );

  availableTabs = [
    { label: 'Objects', value: 'objects' },
    { label: 'Collections', value: 'collections' },
  ] as const satisfies Tab[];

  #userProfile = toSignal(this.#account.userProfile$, { initialValue: undefined });

  isOwnProfile = computed(() => {
    const profile = this.profile();
    return profile._id === this.#userProfile()?._id || profile.ownerId === this.#userProfile()?._id;
  });

  matchesSearch = (name: string | undefined): boolean => {
    const query = this.searchText().toLowerCase().trim();
    if (!query) return true;
    return (name ?? '').toLowerCase().includes(query);
  };

  #annotationCount = (item: FilterableProfileItem): number =>
    item.__annotationCount ?? Object.keys(item.annotations ?? {}).length;

  #effectiveMediaTypes = (item: FilterableProfileItem): string[] =>
    item.__mediaTypes ?? (item.mediaType ? [item.mediaType] : []);

  #applyFilters = <T extends FilterableProfileItem>(items: T[]): T[] => {
    const filters = reduceExploreFilterOptions(this.selectedFilterOptions());

    const withAnnotations = filters.annotation?.includes('with-annotations');
    const withoutAnnotations = filters.annotation?.includes('without-annotations');

    const filtered = items.filter(item => {
      if (filters.mediaType?.length) {
        const mediaTypes = this.#effectiveMediaTypes(item);
        if (!filters.mediaType.some(type => mediaTypes.includes(type))) return false;
      }
      if (filters.annotation?.length) {
        const count = this.#annotationCount(item);
        if (withAnnotations && withoutAnnotations) {
        } else {
          if (withAnnotations && count === 0) return false;
          if (withoutAnnotations && count > 0) return false;
        }
      }
      if (filters.licence?.length) {
        if (!item.__licenses || !filters.licence.some(l => item.__licenses?.includes(l)))
          return false;
      }
      if (filters.misc?.includes('downloadable') && !item.__downloadable) return false;
      return this.matchesSearch(item.name);
    });

    const sortBy = (filters.sortBy?.at(0) ?? SortOrder.newest) as string;
    const reversed = sortBy.endsWith('-reversed');
    const sortKey = reversed ? sortBy.replace('-reversed', '') : sortBy;

    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case SortOrder.annotations:
          return this.#annotationCount(b) - this.#annotationCount(a);
        case SortOrder.name: {
          const comparison = (a.__normalizedName ?? a.name).localeCompare(
            b.__normalizedName ?? b.name,
          );
          return reversed ? -comparison : comparison;
        }
        case SortOrder.popularity:
          return (b.__hits ?? 0) - (a.__hits ?? 0);
        case SortOrder.newest:
          return (b.__createdAt ?? 0) - (a.__createdAt ?? 0);
        default:
          return (b.__hits ?? 0) - (a.__hits ?? 0);
      }
    });
  };

  filteredEntities = computed(() => this.#applyFilters(this.entities()));
  filteredCompilations = computed(() => this.#applyFilters(this.compilations()));

  constructor() {
    effect(() => {
      const profile = this.profile();
      if (!profile) return;
      const profileId = profile._id;
      this.#backend
        .getPublicProfileEntities(profileId)
        .then(entities => this.entities.set(entities ?? []))
        .catch(() => this.entities.set([]));

      this.#backend
        .getPublicProfileCompilations(profileId)
        .then(compilations => this.compilations.set(compilations ?? []))
        .catch(() => this.compilations.set([]));
    });

    effect(() => {
      const counts = {
        objects: this.filteredEntities().length,
        collections: this.filteredCompilations().length,
      };
      const tab = this.selectedTab();
      this.#sidenavOptionsService.setResultCount(
        counts[tab === 'collections' ? 'collections' : 'objects'],
      );
    });

    let isInitialChange = true;
    effect(() => {
      const updatedOptions = this.#sidenavOptionsService.selectedOptions();
      if (isInitialChange) {
        isInitialChange = false;
        return;
      }
      this.selectedFilterOptions.set(updatedOptions);
    });
  }

  public async openFilterSidenav() {
    if (this.#sidenavService.state().opened) return;
    const tab = this.selectedTab();
    const category: ExploreCategory = tab === 'collections' ? 'collections' : 'objects';

    const filterOptions =
      tab === 'collections'
        ? ({
            sortBy: SortByOptions,
            mediaType: [],
            annotation: AnnotationOptions,
            licence: LicenceOptions,
            misc: MiscOptions,
          } satisfies ExploreFilterSidenavData['filterOptions'])
        : ({
            sortBy: SortByOptions,
            mediaType: MediaTypeOptions,
            annotation: AnnotationOptions,
            licence: LicenceOptions,
            misc: MiscOptions,
          } satisfies ExploreFilterSidenavData['filterOptions']);

    const result = await this.#sidenavService.openWithResult<
      ExploreFilterOption[],
      ExploreFilterSidenavData
    >(ExploreFilterSidenavComponent, {
      options: this.selectedFilterOptions(),
      category,
      filterOptions,
    });
    if (result) {
      this.selectedFilterOptions.set(result);
    }
  }

  public onChangeTab(value: string) {
    this.selectedTab.set(value);
    this.selectedFilterOptions.set([]);
  }

  public openEditDialog() {
    this.#helper.editProfile(this.profile());
  }
}
