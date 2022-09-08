import { Component, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { PageEvent } from '@angular/material/paginator';

import { ICompilation, IEntity, IUserData } from 'src/common';
import {
  AccountService,
  DialogHelperService,
  EventsService,
  BackendService,
  QuickAddService,
} from 'src/app/services';
import { SortOrder } from 'src/app/services/backend.service';
import {
  IExploreFilters,
  mediaTypes,
} from 'src/app/components/explore-filters/explore-filters.component';
import { BehaviorSubject, debounceTime } from 'rxjs';

@Component({
  selector: 'app-explore-entities',
  templateUrl: './explore.component.html',
  styleUrls: ['./explore.component.scss'],
  providers: [],
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

  public filteredResults: Array<IEntity | ICompilation> = [];
  public userData: IUserData | undefined;

  public searchOffset = 0;
  public paginatorLength = Number.POSITIVE_INFINITY;
  public paginatorPageSize = 30;
  public paginatorPageIndex = 0;
  private lastRequestTime = 0;

  public userInCompilationResponse: any | undefined;

  // For quick-adding to compilation
  public selectObjectId = '';

  private filters = new BehaviorSubject<IExploreFilters>({
    query: '',
    type: 'objects',
    filters: [],
    mediaTypes: Object.keys(mediaTypes),
    sortOrder: SortOrder.popularity,
  });
  public filters$ = this.filters.asObservable();

  constructor(
    private account: AccountService,
    private backend: BackendService,
    private events: EventsService,
    private dialogHelper: DialogHelperService,
    private quickAdd: QuickAddService,
    private titleService: Title,
    private metaService: Meta,
  ) {
    this.account.userData$.subscribe(newData => {
      if (!newData) return;
      this.userData = newData;
    });

    this.events.$windowMessage.subscribe(message => {
      if (message.data.type === 'updateSearch') {
        this.updateFilter();
      }
    });

    this.filters$.pipe(debounceTime(250)).subscribe(() => this.updateFilter());

    this.updateFilter();
  }

  get isAuthenticated$() {
    return this.account.isAuthenticated$;
  }

  get userCompilations(): ICompilation[] {
    return this.userData?.data?.compilation ?? [];
  }

  public onFiltersChanged(filterGroup: IExploreFilters) {
    this.filters.next(filterGroup);
  }

  public async openCompilationWizard(_id?: string) {
    const element = this.filteredResults.find(e => e._id === _id);
    this.dialogHelper.openCompilationWizard(element);
  }

  public quickAddToCompilation(compilation: ICompilation) {
    this.quickAdd.quickAddToCompilation(compilation, this.selectObjectId);
  }

  public updateFilter(changedPage = false) {
    if (!changedPage) {
      this.paginatorLength = Number.POSITIVE_INFINITY;
      this.paginatorPageIndex = 0;
      this.paginatorPageSize = 30;
      this.searchOffset = 0;
    }

    const { filters, type, query: searchText, mediaTypes, sortOrder } = this.filters.getValue();

    const query = {
      searchEntity: type === 'objects',
      searchText: searchText.toLowerCase(),
      types: mediaTypes,
      filters: {
        annotated: false,
        annotatable: false,
        restricted: false,
        associated: false,
      },
      offset: this.searchOffset,
      reversed: false,
      sortBy: sortOrder,
    };

    for (const key in query.filters) {
      if (!query.filters.hasOwnProperty(key)) continue;
      (query.filters as any)[key] = filters.includes(key);
    }

    this.backend
      .explore(query)
      .then(result => {
        if (result.requestTime < this.lastRequestTime) return;
        this.lastRequestTime = result.requestTime;
        this.filteredResults = Array.isArray(result.array) ? result.array : [];
        console.log(result.array);
        if (Array.isArray(result.array) && result.array.length < this.paginatorPageSize) {
          this.paginatorLength = result.array.length + this.searchOffset;
        }
      })
      .catch(e => console.error(e));
  }

  public changePage(event: PageEvent) {
    this.searchOffset = event.pageIndex * event.pageSize;
    this.paginatorPageIndex = event.pageIndex;
    this.updateFilter(true);
  }

  ngOnInit() {
    this.titleService.setTitle(this.metaTitle);
    this.metaService.addTags(this.metaTags);
  }
}
