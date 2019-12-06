import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSelectChange, MatSelect } from '@angular/material/select';
import { PageEvent } from '@angular/material/paginator';

import {
  ICompilation,
  IEntity,
  IUserData,
  IMetaDataDigitalEntity,
} from '../../interfaces';
import { isCompilation, isEntity, isResolved } from '../../typeguards';
import { EntitiesFilter } from '../../pipes/entities-filter';
import { AccountService } from '../../services/account.service';
import { MongoHandlerService } from '../../services/mongo-handler.service';
import { SnackbarService } from '../../services/snackbar.service';
import { EventsService } from '../../services/events.service';

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

  public searchText = '';
  public showCompilations = false;
  public filteredResults: Array<IEntity | ICompilation> = [];
  public userData: IUserData | undefined;
  public isAuthenticated = false;

  public icons = {
    audio: 'audiotrack',
    video: 'movie',
    image: 'image',
    model: 'language',
    collection: 'apps',
  };
  public mtype = {
    audio: 'Audio',
    video: 'Video',
    image: 'Image',
    model: '3D Model',
  };

  public searchTextTimeout: undefined | any;
  public searchOffset = 0;
  public paginatorLength = Number.POSITIVE_INFINITY;
  public paginatorPageSize = 30;
  public paginatorPageIndex = 0;
  private lastRequestTime = 0;

  public userInCompilationResponse: any | undefined;

  constructor(
    private account: AccountService,
    private mongo: MongoHandlerService,
    private dialog: MatDialog,
    private snackbar: SnackbarService,
    private events: EventsService,
  ) {
    this.account.isUserAuthenticatedObservable.subscribe(
      state => (this.isAuthenticated = state),
    );

    this.account.userDataObservable.subscribe(newData => {
      if (!newData) return;
      this.userData = newData;
      console.log('Userdata received in ProfilePageComponent', this.userData);
    });

    this.events.$windowMessage.subscribe(message => {
      if (message.data.type === 'updateSearch') {
        this.updateFilter();
      }
    });

    this.updateFilter();
  }

  public getTooltipContent = (element: IEntity | ICompilation) => {
    const title = element.name;
    let description = (isEntity(element) && isResolved(element)
      ? (element.relatedDigitalEntity as IMetaDataDigitalEntity).description
      : isCompilation(element)
      ? element.description
      : ''
    ).trim();
    description =
      description.length > 300 ? `${description.slice(0, 297)}…` : description;

    return `${description}`;
  };

  public getBackgroundColor = (element: IEntity) => {
    return `rgba(${Object.values(element.settings.background.color)
      .slice(0, 3)
      .join(',')}, 0.2)`;
  };

  public getImageSource(element: IEntity | ICompilation) {
    return isEntity(element)
      ? element.settings.preview
      : (element.entities[0] as IEntity).settings.preview;
  }

  public getImageSources(element: ICompilation) {
    const sources = (element.entities as IEntity[])
      .filter(e => e && e.settings)
      .map(e => e.settings.preview)
      .slice(0, 4);
    return sources;
  }

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
      query.filters[key] = this.filterTypesSelected.includes(key);
    }

    this.mongo
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

  public isPasswordProtected(element: ICompilation) {
    if (!element.password) return false;
    return true;
  }

  ngOnInit() {}
}
