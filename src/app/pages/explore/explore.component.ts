import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';

import { AsyncPipe } from '@angular/common';
import { toObservable } from '@angular/core/rxjs-interop';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  combineLatest,
  distinctUntilChanged,
  map,
  pairwise,
  shareReplay,
  tap,
  throttleTime,
} from 'rxjs';
import { SearchBarComponent } from 'src/app/components/search-bar/search-bar.component';
import { TabsComponent } from 'src/app/components/tabs/tabs.component';
import { TranslatePipe } from 'src/app/pipes';
import { ObservableValuePipe } from 'src/app/pipes/observable-value';
import {
  AccountService,
  BackendService,
  DialogHelperService,
  EventsService,
  QuickAddService,
} from 'src/app/services';
import { SidenavService } from 'src/app/services/sidenav.service';
import { ICompilation, IEntity, isCompilation } from 'src/common';
import { GridElementComponent } from '../../components/grid-element/grid-element.component';
import { ExploreFilterOption } from './explore-filter-option/explore-filter-option.component';
import {
  ExploreFilterSidenavComponent,
  ExploreFilterSidenavData,
} from './explore-filter-sidenav/explore-filter-sidenav.component';
import {
  CombinedOptions,
  ExploreCategory,
  isExploreCategory,
  SortByOptions,
  SortOrder,
} from './shared-types';

type Pagination = {
  pageCount: number;
  pageSize: number;
  pageIndex: number;
};

@Component({
  selector: 'app-explore-entities',
  templateUrl: './explore.component.html',
  styleUrls: ['./explore.component.scss'],
  providers: [],
  imports: [
    MatTooltipModule,
    MatAutocompleteModule,
    MatOptionModule,
    MatMenuModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    GridElementComponent,
    AsyncPipe,
    RouterModule,
    TranslatePipe,
    ObservableValuePipe,
    TabsComponent,
    SearchBarComponent,
  ],
})
export class ExploreComponent implements OnInit {
  private metaTitle = 'Kompakkt – Explore';
  private metaTags = [
    {
      name: 'keywords',
      content: 'Kompakkt, 3d Viewer, Modelling, Digital Humanities',
    },
    { name: 'robots', content: 'index, follow' },
  ];

  public isWaitingForExploreResult = signal(false);

  #urlObject = signal(new URL(location.href));
  #searchParams = computed(() => this.#urlObject().searchParams);

  public searchText = signal<string>(
    (() => {
      const search = this.#searchParams().get('search') ?? '';
      return decodeURIComponent(search);
    })(),
  );
  public searchTextSuggestions = signal<string[]>([]);
  public filteredResults: Array<IEntity | ICompilation> = [];

  public paginator = signal<Pagination>(
    (() => {
      const page = this.#searchParams().get('page') ?? '0';
      const pageNum = parseInt(page, 10);
      return {
        pageCount: Number.POSITIVE_INFINITY,
        pageSize: 24,
        pageIndex: pageNum,
      } satisfies Pagination;
    })(),
  );
  private lastRequestTime = 0;

  // For quick-adding to compilation
  public selectObjectId = '';

  public availableTabs = [
    { label: 'Objects', value: 'objects' },
    { label: 'Collections', value: 'collections' },
    // TODO: Enable institutions once public profiles are ready
    // { label: 'Institutions', value: 'institutions' },
  ] as const satisfies Array<{ label: string; value: ExploreCategory }>;

  public updateSelectedTab(tab: string) {
    if (isExploreCategory(tab)) {
      this.selectedTab.set(tab as ExploreCategory);
    }
  }
  public selectedTab = signal<ExploreCategory>(
    (() => {
      const category = this.#searchParams().get('category') as ExploreCategory | null;
      return category ?? 'objects';
    })(),
  );

  selectedFilterOptions = signal<ExploreFilterOption[]>(
    (() => {
      const options = this.#searchParams().get('options');
      if (!options) return [];
      return options
        .split('|')
        .map(option => {
          const [category, value] = option.split('_');
          return CombinedOptions.find(
            o => o.category === category && o.value === value,
          ) as ExploreFilterOption;
        })
        .filter(Boolean);
    })(),
  );
  numFilterOptions = computed(() => this.selectedFilterOptions().length);

  changes$ = combineLatest({
    search: toObservable(this.searchText).pipe(throttleTime(500)),
    category: toObservable(this.selectedTab),
    page: toObservable(this.paginator).pipe(map(p => p.pageIndex)),
    options: toObservable(this.selectedFilterOptions),
  }).pipe(
    distinctUntilChanged((prev, next) => JSON.stringify(prev) === JSON.stringify(next)),
    pairwise(),
    tap(([prev, next]) => {
      const hasCategoryChanged = prev.category !== next.category;
      const hasPageRemained = prev.page === next.page;
      if (hasCategoryChanged || hasPageRemained) {
        // Reset page when category changes or when other parameters change but page remains the same
        this.paginator.update(state => ({
          ...state,
          pageIndex: 0,
          pageCount: Number.POSITIVE_INFINITY,
        }));
        next.page = 0;
      }
    }),
    map(([_, next]) => next),
    shareReplay(1),
  );

  constructor(
    private account: AccountService,
    private backend: BackendService,
    private events: EventsService,
    private dialogHelper: DialogHelperService,
    private quickAdd: QuickAddService,
    private titleService: Title,
    private metaService: Meta,
  ) {
    this.events.$windowMessage.subscribe(message => {
      if (message.data.type === 'updateSearch') {
        this.updateFilter();
      }
    });

    this.changes$.subscribe(({ search, category, options, page }) => {
      const url = new URL(location.href);
      if (search.length > 0) url.searchParams.set('search', encodeURIComponent(search));
      else url.searchParams.delete('search');
      if (category !== 'objects') url.searchParams.set('category', category);
      else url.searchParams.delete('category');
      if (page !== 0) url.searchParams.set('page', page.toString());
      else url.searchParams.delete('page');
      if (options.length > 0)
        url.searchParams.set('options', options.map(o => o.category + '_' + o.value).join('|'));
      else url.searchParams.delete('options');

      window.history.replaceState(null, '', url.toString());
      this.updateFilter();
    });
  }

  get isAuthenticated$() {
    return this.account.isAuthenticated$;
  }

  userCompilations$ = this.account.compilations$.pipe(
    map(compilations => compilations.filter(isCompilation)),
  );

  public async openCompilationWizard(_id?: string) {
    const element = this.filteredResults.find(e => e._id === _id);
    this.dialogHelper.openCompilationWizard(element);
  }

  public quickAddToCompilation(compilation: ICompilation) {
    this.quickAdd.quickAddToCompilation(compilation, this.selectObjectId);
  }

  public updateFilter() {
    const filters = this.selectedFilterOptions();
    const sortBy = (filters.find(o => o.category === 'sortBy')?.value ??
      SortByOptions.find(o => o.default)?.value ??
      SortOrder.popularity) as SortOrder;
    const mediaTypes = filters.filter(o => o.category === 'mediaType').map(o => o.value);
    const annotations = filters.find(o => o.category === 'annotation')?.value ?? 'all';
    const access = filters.filter(o => o.category === 'access').map(o => o.value);
    const licences = filters.filter(o => o.category === 'licence').map(o => o.value);
    const misc = filters.filter(o => o.category === 'misc').map(o => o.value);

    const { pageIndex, pageSize } = this.paginator();

    const query = {
      searchText: this.searchText().toLowerCase().trim(),
      filterBy: this.selectedTab(),
      mediaTypes,
      annotations,
      licences,
      misc,
      access,
      offset: pageIndex * pageSize,
      limit: pageSize,
      reversed: sortBy.endsWith('-reversed'),
      sortBy: sortBy.split('-').at(0) as SortOrder,
    };

    this.isWaitingForExploreResult.set(true);
    this.backend
      .exploreV2(query)
      .then(response => {
        if (response.requestTime < this.lastRequestTime) return;
        this.lastRequestTime = response.requestTime;
        this.filteredResults = Array.isArray(response.results) ? response.results : [];
        this.searchTextSuggestions.set(response.suggestions);
        console.log(response.results);
        const { pageSize, pageIndex } = this.paginator();
        if (Array.isArray(response.results)) {
          if (response.results.length === 0) {
            this.paginator.update(state => ({
              ...state,
              pageIndex: pageIndex > 0 ? pageIndex - 1 : 0,
              pageCount: 1,
            }));
          } else if (response.results.length < pageSize) {
            this.paginator.update(state => ({
              ...state,
              pageCount: pageIndex + 1,
            }));
          } else {
            this.paginator.update(state => ({
              ...state,
              pageCount: Number.POSITIVE_INFINITY,
            }));
          }
        }
      })
      .catch(e => console.error(e))
      .finally(() => this.isWaitingForExploreResult.set(false));
  }

  canNavigatePrevious = computed(() => {
    const { pageIndex } = this.paginator();
    return pageIndex > 0;
  });
  public previousPage() {
    this.paginator.update(state => ({
      ...state,
      pageIndex: Math.max(0, state.pageIndex - 1),
    }));
  }

  canNavigateNext = computed(() => {
    const { pageIndex, pageCount } = this.paginator();
    return pageIndex + 1 < pageCount;
  });
  public nextPage() {
    this.paginator.update(state => ({
      ...state,
      pageIndex: state.pageIndex + 1,
    }));
  }

  #sidenavService = inject(SidenavService);
  public async openFilterSidenav() {
    if (this.#sidenavService.state().opened) return;
    const result = await this.#sidenavService.openWithResult<
      ExploreFilterOption[],
      ExploreFilterSidenavData
    >(ExploreFilterSidenavComponent, {
      options: this.selectedFilterOptions(),
      category: this.selectedTab(),
    });
    if (result) {
      this.selectedFilterOptions.set(result);
    }
  }

  ngOnInit() {
    this.titleService.setTitle(this.metaTitle);
    this.metaService.addTags(this.metaTags);
  }
}
