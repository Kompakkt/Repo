import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSelectChange } from '@angular/material/select';

import { ConfirmationDialogComponent } from '../../dialogs/confirmation-dialog/confirmation-dialog.component';
import { UploadApplicationDialogComponent } from '../../dialogs/upload-application-dialog/upload-application-dialog.component';
import { EUserRank, ICompilation, IEntity, IUserData } from '../../interfaces';
import { AccountService } from '../../services/account.service';
import { MongoHandlerService } from '../../services/mongo-handler.service';
import { AddCompilationWizardComponent } from '../wizards/add-compilation/add-compilation-wizard.component';
import { AddEntityWizardComponent } from '../wizards/add-entity/add-entity-wizard.component';

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
    private mongo: MongoHandlerService,
    private dialog: MatDialog,
  ) {
    this.account.isUserAuthenticatedObservable.subscribe(
      state => (this.isAuthenticated = state),
    );

    this.account.userDataObservable.subscribe(newData => {
      if (!newData) return;
      this.userData = newData;
      console.log('Userdata received in ActionbarPageComponent', this.userData);
    });
  }

  public isUploader = () => {
    if (!this.userData) return false;
    return (
      this.userData.role === EUserRank.admin ||
      this.userData.role === EUserRank.uploader
    );
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

  public openCompilationCreation(compilation?: ICompilation) {
    const dialogRef = this.dialog.open(AddCompilationWizardComponent, {
      data: compilation ? compilation : undefined,
      disableClose: true,
    });
    dialogRef
      .afterClosed()
      .toPromise()
      .then(result => {
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

  public openEntityCreation(entity?: IEntity) {
    const dialogRef = this.dialog.open(AddEntityWizardComponent, {
      data: entity ? entity : undefined,
      disableClose: true,
    });

    dialogRef
      .afterClosed()
      .toPromise()
      .then(result => {
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
}
