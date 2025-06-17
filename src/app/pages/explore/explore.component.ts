import { Component, OnInit, signal } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { Meta, Title } from '@angular/platform-browser';

import { AsyncPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatMenu } from '@angular/material/menu';
import { TranslatePipe } from 'src/app/pipes';
import {
  AccountService,
  BackendService,
  DialogHelperService,
  EventsService,
  QuickAddService,
} from 'src/app/services';
import { SortOrder } from 'src/app/services/backend.service';
import { ICompilation, IEntity, isCompilation, IUserData } from 'src/common';
import { ActionbarComponent } from '../../components/actionbar/actionbar.component';
import { GridElementComponent } from '../../components/grid-element/grid-element.component';
import { IUserDataWithoutData } from 'src/common/interfaces';
import { map } from 'rxjs';

@Component({
  selector: 'app-explore-entities',
  templateUrl: './explore.component.html',
  styleUrls: ['./explore.component.scss'],
  providers: [],
  imports: [
    ActionbarComponent,
    GridElementComponent,
    MatPaginator,
    MatMenu,
    MatButtonModule,
    MatIcon,
    AsyncPipe,
    TranslatePipe,
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

  public mediaTypesSelected = ['model', 'audio', 'video', 'image'];
  public filterTypesSelected: string[] = [];

  public searchText = '';
  public searchTextSuggestions = signal<string[]>([]);
  public showCompilations = false;
  public sortOrder: SortOrder = SortOrder.popularity;
  public filteredResults: Array<IEntity | ICompilation> = [];
  public userData: IUserDataWithoutData | undefined;

  public searchTextTimeout: undefined | any;
  public searchOffset = 0;
  public paginatorLength = Number.POSITIVE_INFINITY;
  public paginatorPageSize = 30;
  public paginatorPageIndex = 0;
  private lastRequestTime = 0;

  public userInCompilationResponse: any | undefined;

  // For quick-adding to compilation
  public selectObjectId = '';

  constructor(
    private translatePipe: TranslatePipe,
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

    this.updateFilter();
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

  public updateFilter(changedPage = false) {
    if (!changedPage) {
      this.paginatorLength = Number.POSITIVE_INFINITY;
      this.paginatorPageIndex = 0;
      this.paginatorPageSize = 30;
      this.searchOffset = 0;
    }

    const query = {
      searchEntity: !this.showCompilations,
      searchText: this.searchText.toLowerCase(),
      types: this.mediaTypesSelected,
      filters: {
        annotated: false,
        annotatable: false,
        restricted: false,
        associated: false,
      },
      offset: this.searchOffset,
      reversed: false,
      sortBy: this.sortOrder,
    };

    for (const key in query.filters) {
      if (!query.filters.hasOwnProperty(key)) continue;
      (query.filters as any)[key] = this.filterTypesSelected.includes(key);
    }

    this.backend
      .explore(query)
      .then(response => {
        if (response.requestTime < this.lastRequestTime) return;
        this.lastRequestTime = response.requestTime;
        this.filteredResults = Array.isArray(response.results) ? response.results : [];
        this.searchTextSuggestions.set(response.suggestions);
        console.log(response.results);
        if (Array.isArray(response.results) && response.results.length < this.paginatorPageSize) {
          this.paginatorLength = response.results.length + this.searchOffset;
        }
      })
      .catch(e => console.error(e));
  }

  public searchTextChanged() {
    if (this.searchTextTimeout) {
      clearTimeout(this.searchTextTimeout);
    }
    this.searchTextTimeout = setTimeout(() => {
      this.updateFilter();
    }, 200);
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
