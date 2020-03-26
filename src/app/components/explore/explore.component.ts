import { Component, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { PageEvent } from '@angular/material/paginator';

import { ICompilation, IEntity, IUserData } from '@kompakkt/shared';
import { AccountService } from '../../services/account.service';
import { DialogHelperService } from '../../services/dialog-helper.service';
import { EventsService } from '../../services/events.service';
import { BackendService } from '../../services/backend.service';
import { QuickAddService } from '../../services/quick-add.service';

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

  public mediaTypesSelected = ['model', 'audio', 'video', 'image'];
  public filterTypesSelected: string[] = [];

  public searchText = '';
  public showCompilations = false;
  public filteredResults: Array<IEntity | ICompilation> = [];
  public userData: IUserData | undefined;
  public isAuthenticated = false;

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
    private account: AccountService,
    private backend: BackendService,
    private events: EventsService,
    private dialogHelper: DialogHelperService,
    private quickAdd: QuickAddService,
    private titleService: Title,
    private metaService: Meta,
  ) {
    this.account.isUserAuthenticatedObservable.subscribe(
      state => (this.isAuthenticated = state),
    );

    this.account.userDataObservable.subscribe(newData => {
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

  public openCompilationWizard = (newEntityId?: string) =>
    this.dialogHelper.openCompilationWizard(newEntityId);

  public quickAddToCompilation = (compilation: ICompilation) =>
    this.quickAdd.quickAddToCompilation(compilation, this.selectObjectId);

  public getUserCompilations = () =>
    this.userData && this.userData.data && this.userData.data.compilation
      ? this.userData.data.compilation
      : [];

  public updateFilter = (changedPage = false) => {
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
    };

    for (const key in query.filters) {
      if (!query.filters.hasOwnProperty(key)) continue;
      (query.filters as any)[key] = this.filterTypesSelected.includes(key);
    }

    this.backend
      .explore(query)
      .then(result => {
        if (result.requestTime < this.lastRequestTime) return;
        this.lastRequestTime = result.requestTime;
        this.filteredResults = Array.isArray(result.array) ? result.array : [];
        if (
          Array.isArray(result.array) &&
          result.array.length < this.paginatorPageSize
        ) {
          this.paginatorLength = result.array.length + this.searchOffset;
        }
      })
      .catch(e => console.error(e));
  };

  public searchTextChanged = () => {
    if (this.searchTextTimeout) {
      clearTimeout(this.searchTextTimeout);
    }
    this.searchTextTimeout = setTimeout(() => {
      this.updateFilter();
    }, 200);
  };

  public changePage = (event: PageEvent) => {
    this.searchOffset = event.pageIndex * event.pageSize;
    this.paginatorPageIndex = event.pageIndex;
    this.updateFilter(true);
  };

  ngOnInit() {
    this.titleService.setTitle(this.metaTitle);
    this.metaService.addTags(this.metaTags);
  }
}
