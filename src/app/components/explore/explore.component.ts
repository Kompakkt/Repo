import { Component, OnInit, ViewChild } from '@angular/core';
import { MatSelectChange, MatSelect } from '@angular/material/select';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';

import {
  IAnnotation,
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
import { DialogHelperService } from '../../services/dialog-helper.service';

@Component({
  selector: 'app-explore-entities',
  templateUrl: './explore.component.html',
  styleUrls: ['./explore.component.scss'],
  providers: [EntitiesFilter],
})
export class ExploreComponent implements OnInit {
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
    private mongo: MongoHandlerService,
    private snackbar: SnackbarService,
    private events: EventsService,
    private dialogHelper: DialogHelperService,
    private dialog: MatDialog,
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

  public openCompilationWizard = () =>
    this.dialogHelper.openCompilationWizard();

  public quickAddToCompilation = (compilation: ICompilation) => {
    const compilationHasObject = (comp: ICompilation) =>
      (comp.entities as IEntity[])
        .filter(e => e)
        .map(e => e._id)
        .includes(this.selectObjectId);

    if (compilationHasObject(compilation)) {
      this.snackbar.showMessage('Object already in collection');
      return;
    }

    if (!this.selectObjectId || this.selectObjectId === '') {
      console.error('No object selected');
      return;
    }
    this.mongo
      .getCompilation(compilation._id)
      .then(result => {
        if (result.status === 'ok') {
          return result;
        }
        throw new Error('Failed getting compilation');
      })
      .then(_compilation => {
        if (compilationHasObject(_compilation)) {
          this.snackbar.showMessage('Object already in collection');
          throw new Error('Object already in collection');
        }
        _compilation.entities.push({ _id: this.selectObjectId });
        return this.mongo.pushCompilation(_compilation);
      })
      .then(result => {
        if (result.status === 'ok') {
          return result;
        }
        throw new Error('Failed updating compilation');
      })
      .then(result => {
        if (
          this.userData &&
          this.userData.data &&
          this.userData.data.compilation
        ) {
          const found = this.userData.data.compilation.findIndex(
            comp => comp._id === result._id,
          );
          if (found) {
            this.userData.data.compilation.splice(found, 1, result);
          }
        }

        console.log('Updated compilation: ', result);
        this.snackbar.showMessage('Added object to collection');
      })
      .catch(err => console.error(err));
  };

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

  ngOnInit() {}
}
