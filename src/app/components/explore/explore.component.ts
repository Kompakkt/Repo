import { Component, OnInit } from '@angular/core';
import { MatDialog, PageEvent } from '@angular/material';

import { ICompilation, IEntity, IUserData } from '../../interfaces';
import { isCompilation, isEntity } from '../../typeguards';
import { EntitiesFilter } from '../../pipes/entities-filter';
import { AccountService } from '../../services/account.service';
import { MongoHandlerService } from '../../services/mongo-handler.service';
import { SnackbarService } from '../../services/snackbar.service';

@Component({
  selector: 'app-explore-entities',
  templateUrl: './explore.component.html',
  styleUrls: ['./explore.component.scss'],
  providers: [EntitiesFilter],
})
export class ExploreComponent implements OnInit {
  public isEntity = isEntity;
  public isCompilation = isCompilation;

  public mediaTypesSelected = ['model', 'audio', 'video', 'image'];
  public filterTypesSelected: string[] = [];

  public sidebar = {
    width: '0',
  };

  public searchText = '';
  public showCompilations = false;
  public filteredResults: Array<IEntity | ICompilation> = [];
  public userData: IUserData | undefined;
  public isAuthenticated = false;
  public selectedElement: IEntity | ICompilation | undefined;

  public icons = {
    audio: 'audiotrack',
    video: 'movie',
    image: 'image',
    model: 'language',
    collection: 'apps',
  };

  public searchTextTimeout: undefined | any;
  public searchOffset = 0;
  public paginatorLength = Number.POSITIVE_INFINITY;
  public paginatorPageSize = 20;
  public paginatorPageIndex = 0;

  public userInCompilationResponse: any | undefined;

  constructor(
    private account: AccountService,
    private mongo: MongoHandlerService,
    private dialog: MatDialog,
    private snackbar: SnackbarService,
  ) {
    this.account.isUserAuthenticatedObservable.subscribe(
      state => (this.isAuthenticated = state),
    );

    this.account.userDataObservable.subscribe(newData => {
      if (!newData) return;
      this.userData = newData;
      console.log('Userdata received in ProfilePageComponent', this.userData);
    });

    this.updateFilter();
  }

  public getImageSource(element: IEntity | ICompilation) {
    return isEntity(element)
      ? element.settings.preview
      : (element.entities[0] as IEntity).settings.preview;
  }

  public closeSidebar() {
    this.selectedElement = undefined;
  }

  public select(element: IEntity | ICompilation) {
    this.userInCompilationResponse = undefined;

    this.selectedElement =
      this.selectedElement && this.selectedElement._id === element._id
        ? undefined
        : element;

    this.sidebar.width = this.sidebar.width === '0' ? '250px' : '0';

    if (isEntity(element)) {
      this.mongo
        .countEntityUses(element._id)
        .then(result => (this.userInCompilationResponse = result))
        .catch(_ => (this.userInCompilationResponse = undefined));
    }
  }

  public isSelected = (element: IEntity | ICompilation) =>
    this.selectedElement && this.selectedElement._id === element._id;

  public updateFilter = (changedPage = false) => {
    if (!changedPage) {
      this.paginatorLength = Number.POSITIVE_INFINITY;
      this.paginatorPageIndex = 0;
      this.paginatorPageSize = 20;
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
      query.filters[key] = this.filterTypesSelected.includes(key);
    }

    this.mongo
      .explore(query)
      .then(result => {
        this.filteredResults = Array.isArray(result) ? result : [];
        if (Array.isArray(result) && result.length < this.paginatorPageSize) {
          this.paginatorLength = result.length + this.searchOffset;
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
    }, 50);
  };

  public changePage = (event: PageEvent) => {
    this.searchOffset = event.pageIndex * event.pageSize;
    this.paginatorPageIndex = event.pageIndex;
    this.updateFilter(true);
  };

  public isPasswordProtected(element: ICompilation) {
    if (!element.password) return false;
    return true;
  }

  public copyID(_id: string) {
    try {
      if ((navigator as any).clipboard) {
        (navigator as any).clipboard.writeText(_id);
      } else if ((window as any).clipboardData) {
        (window as any).clipboardData.setData('text', _id);
      }
      this.snackbar.showMessage('Copied to clipboard', 3);
    } catch (e) {
      console.error(e);
      this.snackbar.showMessage('Could not access your clipboard', 3);
    }
  }

  ngOnInit() {}
}
