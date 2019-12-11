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

import { ExploreEntityDialogComponent } from '../../dialogs/explore-entity/explore-entity-dialog.component';
import { ExploreCompilationDialogComponent } from '../../dialogs/explore-compilation-dialog/explore-compilation-dialog.component';

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

  public isRecentlyAnnotated = (element: ICompilation) =>
    (element.annotationList.filter(anno => anno) as IAnnotation[]).find(
      anno => {
        const date = new Date(
          parseInt(anno._id.slice(0, 8), 16) * 1000,
        ).getTime();
        return date >= Date.now() - 86400000;
      },
    ) !== undefined;

  public openExploreDialog(element: IEntity | ICompilation) {
    if (!element) return;

    if (isCompilation(element)) {
      // tslint:disable-next-line:no-non-null-assertion
      const eId = (element.entities[0] as IEntity)._id;

      this.dialog.open(ExploreCompilationDialogComponent, {
        data: {
          collectionId: element._id,
          entityId: eId,
        },
        id: 'explore-compilation-dialog',
      });
    } else {
      this.dialog.open(ExploreEntityDialogComponent, {
        data: element._id,
        id: 'explore-entity-dialog',
      });
    }
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

  public getCollectionQuantityIcon = (element: ICompilation) => {
    return element.entities.length > 9
      ? 'filter_9_plus'
      : `filter_${element.entities.length}`;
  };

  public getCollectionQuantityText = (element: ICompilation) =>
    `This collection contains ${element.entities.length} objects`;

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
