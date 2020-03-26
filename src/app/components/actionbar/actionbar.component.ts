import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSelectChange } from '@angular/material/select';
import { Router } from '@angular/router';

import { ConfirmationDialogComponent } from '../../dialogs/confirmation-dialog/confirmation-dialog.component';
import { UploadApplicationDialogComponent } from '../../dialogs/upload-application-dialog/upload-application-dialog.component';
import {
  isAnnotation,
  isCompilation,
  isEntity,
  EUserRank,
  ICompilation,
  IEntity,
  IUserData,
} from '@kompakkt/shared';
import { AccountService } from '../../services/account.service';
import { BackendService } from '../../services/backend.service';
import { EventsService } from '../../services/events.service';
import { SelectHistoryService } from '../../services/select-history.service';
import { DialogHelperService } from '../../services/dialog-helper.service';
import { AllowAnnotatingService } from '../../services/allow-annotating.service';
import { QuickAddService } from '../../services/quick-add.service';
import { AddEntityWizardComponent } from '../../wizards/add-entity/add-entity-wizard.component';

@Component({
  selector: 'app-actionbar',
  templateUrl: './actionbar.component.html',
  styleUrls: ['./actionbar.component.scss'],
})
export class ActionbarComponent {
  @Input() showFilters = false;
  public searchText = '';
  @Output() searchTextChange = new EventEmitter();
  public showCompilations = false;
  @Output() showCompilationsChange = new EventEmitter();
  @Output() mediaTypesChange = new EventEmitter();
  @Output() filterTypesChange = new EventEmitter();
  @Input() showAnnotateButton = false;
  @Input() element: IEntity | ICompilation | undefined;
  @Input() showEditButton = false;
  @Input() showUsesInCollection = false;
  @Output()
  public newElementSelected = new EventEmitter<
    undefined | IEntity | ICompilation
  >();

  public isEntity = isEntity;
  public isCompilation = isCompilation;

  public mediaTypesOptions = [
    {
      name: '3D Models',
      enabled: true,
      value: 'model',
    },
    {
      name: 'Audio',
      enabled: true,
      value: 'audio',
    },
    {
      name: 'Video',
      enabled: true,
      value: 'video',
    },
    {
      name: 'Image',
      enabled: true,
      value: 'image',
    },
  ];

  public mediaTypesSelected = new FormControl(
    this.mediaTypesOptions.filter(el => el.enabled).map(el => el.value),
  );

  public filterTypesOptions = [
    {
      enabled: false,
      name: 'Annotatable',
      value: 'annotatable',
      help: 'Only show entities you are allowed to annotate',
      onlyOnEntity: false,
    },
    {
      enabled: false,
      name: 'Annotated',
      value: 'annotated',
      help: 'Only show entities that have been annotated',
      onlyOnEntity: false,
    },
    {
      enabled: false,
      name: 'Restricted',
      value: 'restricted',
      help: 'Only show entities that are not public, but where you have access',
      onlyOnEntity: false,
    },
    {
      enabled: false,
      name: 'Associated',
      value: 'associated',
      help: 'Only show entities where you are mentioned in metadata',
      onlyOnEntity: true,
    },
  ];

  public filterTypesSelected = new FormControl(
    this.filterTypesOptions.filter(el => el.enabled).map(el => el.value),
  );

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

  public searchOffset = 0;
  public paginatorLength = Number.POSITIVE_INFINITY;
  public paginatorPageSize = 20;
  public paginatorPageIndex = 0;

  constructor(
    private account: AccountService,
    private backend: BackendService,
    private dialog: MatDialog,
    private dialogHelper: DialogHelperService,
    private events: EventsService,
    private router: Router,
    private allowAnnotatingHelper: AllowAnnotatingService,
    public selectHistory: SelectHistoryService,
    private quickAdd: QuickAddService,
  ) {
    this.account.isUserAuthenticatedObservable.subscribe(
      state => (this.isAuthenticated = state),
    );

    this.account.userDataObservable.subscribe(newData => {
      if (!newData) return;
      this.userData = newData;
    });
  }

  public quickAddToCompilation = (comp: ICompilation) => {
    if (!this.element) return;
    this.quickAdd.quickAddToCompilation(comp, this.element._id.toString());
  };

  public getUserCompilations = () =>
    this.userData && this.userData.data && this.userData.data.compilation
      ? this.userData.data.compilation
      : [];

  public openCompilationWizard = () => {
    if (!this.element) return;
    this.dialogHelper.openCompilationWizard(this.element._id.toString());
  };

  /**
   * Display whether the current entity has been recently
   * annotated in a compilation
   * */
  public isRecentlyAnnotated = (element: ICompilation) => {
    for (const id in element.annotations) {
      const anno = element.annotations[id];
      if (!isAnnotation(anno)) continue;
      if (anno.target.source.relatedEntity !== this.element?._id) continue;
      const date = new Date(
        parseInt(anno._id.toString().slice(0, 8), 16) * 1000,
      ).getTime();
      if (date >= Date.now() - 86400000) return true;
    }
    return false;
  };

  public isAnnotatedInCompilation = (compilation: ICompilation) => {
    if (!this.element) return false;
    if (!isEntity(this.element)) return false;
    const _id = this.element._id;
    for (const id in compilation.annotations) {
      const anno = compilation.annotations[id];
      if (!isAnnotation(anno)) continue;
      if (anno?.target?.source?.relatedEntity === _id) return true;
    }
    return false;
  };

  get allowAnnotating() {
    if (!this.element) return false;
    if (isEntity(this.element)) {
      return this.allowAnnotatingHelper.isUserOwner(this.element);
    }
    if (isCompilation(this.element)) {
      return (
        this.allowAnnotatingHelper.isUserOwner(this.element) ||
        this.allowAnnotatingHelper.isElementPublic(this.element) ||
        this.allowAnnotatingHelper.isUserWhitelisted(this.element)
      );
    }
    return false;
  }

  get allowEditing() {
    if (!this.element) return false;
    return this.allowAnnotatingHelper.isUserOwner(this.element);
  }

  public getAnnotateLink = () => {
    return this.element
      ? isEntity(this.element)
        ? ['/annotate', 'entity', this.element._id]
        : ['/annotate', 'compilation', this.element._id]
      : ['/explore'];
  };

  public navigate = (element: IEntity | ICompilation) => {
    // Parent will load and fetch relevant data
    this.element = undefined;

    return this.router.navigateByUrl(
      `/${isEntity(element) ? 'entity' : 'compilation'}/${element._id}`,
    );
  };

  public isUploader = () => {
    if (!this.userData) return false;
    return (
      this.userData.role === EUserRank.admin ||
      this.userData.role === EUserRank.uploader
    );
  };

  public uploadRequested = () => {
    if (!this.userData) return false;
    return this.userData.role === EUserRank.uploadrequested;
  };

  public toggleSlide = () => {
    this.showCompilations = !this.showCompilations;
    this.showCompilationsChange.emit(this.showCompilations);
  };

  public searchTextChanged = () => {
    this.searchTextChange.emit(this.searchText);
  };

  public updateMediaTypeOptions = (event: MatSelectChange) => {
    const enabledList = event.source.value as string[];
    this.mediaTypesOptions.forEach(
      el => (el.enabled = enabledList.includes(el.value)),
    );
    this.mediaTypesChange.emit(this.mediaTypesSelected.value);
  };

  public updateFilterTypeOptions = (event: MatSelectChange) => {
    const enabledList = event.source.value as string[];
    this.filterTypesOptions.forEach(
      el => (el.enabled = enabledList.includes(el.value)),
    );
    this.filterTypesChange.emit(this.filterTypesSelected.value);
  };

  public getFilterTypeOptions = () =>
    this.filterTypesOptions.filter(el =>
      this.showCompilations ? !el.onlyOnEntity : true,
    );

  public async openCompilationCreation(compilation?: ICompilation) {
    if (!this.isAuthenticated) return;

    const dialogRef = this.dialogHelper.openCompilationWizard(compilation);
    dialogRef
      .afterClosed()
      .toPromise()
      .then(result => {
        this.events.updateSearchEvent();
        if (result && this.userData && this.userData.data.compilation) {
          if (compilation) {
            const index = (this.userData.data
              .compilation as ICompilation[]).findIndex(
              comp => comp._id === result._id,
            );
            if (index === -1) return;
            this.userData.data.compilation.splice(
              index,
              1,
              result as ICompilation,
            );
          } else {
            (this.userData.data.compilation as ICompilation[]).push(
              result as ICompilation,
            );
          }
        }
      });
  }

  public async openEntityCreation(entity?: IEntity) {
    if (!this.isAuthenticated) return;

    const dialogRef = this.dialog.open(AddEntityWizardComponent, {
      data: entity ? entity : undefined,
      disableClose: true,
    });

    dialogRef
      .afterClosed()
      .toPromise()
      .then(result => {
        this.events.updateSearchEvent();
        if (result && this.userData && this.userData.data.entity) {
          const index = (this.userData.data.entity as IEntity[]).findIndex(
            _en => result._id === _en._id,
          );
          if (index === -1) return;
          this.userData.data.entity.splice(index, 1, result as IEntity);
          // this.updateFilter();
        }
      });
  }

  public openUploadApplication() {
    if (!this.userData) {
      alert('Not logged in');
      return;
    }
    const dialogRef = this.dialog.open(UploadApplicationDialogComponent, {
      data: this.userData,
      disableClose: true,
    });

    dialogRef.backdropClick().subscribe(async _ => {
      const confirm = this.dialog.open(ConfirmationDialogComponent, {
        data: `Do you want to cancel your application?`,
      });
      await confirm
        .afterClosed()
        .toPromise()
        .then(shouldClose => {
          if (shouldClose) {
            dialogRef.close();
          }
        });
    });
  }

  public openLoginDialog = () => this.dialogHelper.openLoginDialog();

  public openRegisterDialog = () => this.dialogHelper.openRegisterDialog();

  public editSettingsInViewer = () =>
    this.dialogHelper.editSettingsInViewer(this.element as IEntity);

  public editMetadata = () =>
    this.dialogHelper.editMetadata(this.element as IEntity);

  public editVisibility = () =>
    this.dialogHelper.editVisibility(this.element as IEntity);

  public editCompilation = () =>
    this.dialogHelper.editCompilation(this.element as ICompilation);

  get isPublished() {
    if (this.element && isEntity(this.element)) {
      return (this.element as IEntity).online;
    }
    return false;
  }

  public togglePublished = () => {
    if (!this.element || !isEntity(this.element) || !this.isAuthenticated)
      return;
    this.backend
      .pushEntity({ ...this.element, online: !this.element.online })
      .then(result => {
        console.log('Toggled?:', result);
        if (isEntity(result)) this.element = result;
      })
      .catch(error => console.error(error));
  };
}
