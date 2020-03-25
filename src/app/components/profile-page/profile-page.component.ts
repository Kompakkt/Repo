import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent, MatPaginator } from '@angular/material/paginator';
import { Router, ActivatedRoute } from '@angular/router';

import {
  isEntity,
  isMetadataEntity,
  isResolved,
  ICompilation,
  IEntity,
  IGroup,
  IUserData,
  IUnresolvedEntity,
} from '@kompakkt/shared';
import { AccountService } from '../../services/account.service';
import { BackendService } from '../../services/backend.service';
import { DialogHelperService } from '../../services/dialog-helper.service';
import { EntitySettingsDialogComponent } from '../../dialogs/entity-settings-dialog/entity-settings-dialog.component';
import { GroupMemberDialogComponent } from '../../dialogs/group-member-dialog/group-member-dialog.component';
import { ConfirmationDialogComponent } from '../../dialogs/confirmation-dialog/confirmation-dialog.component';
import { EntityRightsDialogComponent } from '../../dialogs/entity-rights-dialog/entity-rights-dialog.component';
import { AuthDialogComponent } from '../auth-dialog/auth-dialog.component';
import { AddGroupWizardComponent } from '../../wizards/add-group-wizard/add-group-wizard.component';
import { AddCompilationWizardComponent } from '../../wizards/add-compilation/add-compilation-wizard.component';
import { AddEntityWizardComponent } from '../../wizards/add-entity/add-entity-wizard.component';
import { ProfilePageHelpComponent } from './profile-page-help.component';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 'app-profile-page',
  templateUrl: './profile-page.component.html',
  styleUrls: ['./profile-page.component.scss'],
})
export class ProfilePageComponent implements OnInit {
  public userData: IUserData;

  public filter = {
    public: true,
    private: false,
    restricted: false,
    unfinished: false,
  };
  public filteredEntities: IEntity[] = [];
  public filteredCompilations: ICompilation[] = [];
  public filteredGroups: IGroup[] = [];

  public showPartakingGroups = false;
  public showPartakingCompilations = false;

  private partakingGroups: IGroup[] = [];
  private partakingCompilations: ICompilation[] = [];

  public icons = {
    audio: 'audiotrack',
    video: 'movie',
    image: 'image',
    model: 'language',
    collection: 'apps',
  };

  public pageEvent: PageEvent = {
    previousPageIndex: 0,
    pageIndex: 0,
    pageSize: 20,
    length: Number.POSITIVE_INFINITY,
  };

  public entitySearchInput = '';

  constructor(
    private account: AccountService,
    private dialog: MatDialog,
    private backend: BackendService,
    private router: Router,
    private dialogHelper: DialogHelperService,
    private titleService: Title,
    private route: ActivatedRoute,
  ) {
    this.userData = this.route.snapshot.data.userData;

    this.account.userDataObservable.subscribe(newData => {
      this.userData = newData;
      if (!this.userData) return;
      this.backend
        .findUserInGroups()
        .then(groups => (this.partakingGroups = groups))
        .catch(e => console.error(e));

      this.backend
        .findUserInCompilations()
        .then(compilations => (this.partakingCompilations = compilations))
        .catch(e => console.error(e));
      this.updateFilter();
    });
  }

  public changeEntitySearchText(event: InputEvent, paginator: MatPaginator) {
    this.entitySearchInput =
      event.target && (event.target as HTMLInputElement).value
        ? (event.target as HTMLInputElement).value.toLowerCase()
        : '';
    paginator.firstPage();
  }

  // Entities filtered by paginator
  get PaginatorEntities() {
    const start = this.pageEvent.pageSize * this.pageEvent.pageIndex;
    const end = start + this.pageEvent.pageSize;
    return this.filteredEntities
      .filter(_e => {
        let content = _e.name;
        if (isMetadataEntity(_e.relatedDigitalEntity)) {
          content += _e.relatedDigitalEntity.title;
          content += _e.relatedDigitalEntity.description;
        }
        return content.toLowerCase().includes(this.entitySearchInput);
      })
      .slice(start, end);
  }

  public updateFilter = (property?: string, paginator?: MatPaginator) => {
    // On radio button change
    if (property) {
      // Disable wrong filters
      for (const prop in this.filter) {
        (this.filter as any)[prop] = prop === property;
      }
    }

    if (paginator) {
      paginator.firstPage();
    }

    const updatedList: IEntity[] = [];
    if (this.filter.public) {
      updatedList.push(...this.getPublicEntities());
    }
    if (this.filter.private) {
      updatedList.push(...this.getPrivateEntities());
    }
    if (this.filter.restricted) {
      updatedList.push(...this.getRestrictedEntities());
    }
    if (this.filter.unfinished) {
      updatedList.push(...this.getUnfinishedEntities());
    }

    this.filteredEntities = Array.from(new Set(updatedList)).filter(obj => obj);
    this.pageEvent.length = this.filteredEntities.length;
  };

  // Entities
  // Public: finished && online && !whitelist.enabled
  public getPublicEntities = (): IEntity[] =>
    this.userData?.data?.entity.filter(
      entity =>
        isResolved(entity) &&
        isEntity(entity) &&
        entity.finished &&
        entity.online &&
        !entity.whitelist.enabled,
    ) ?? [];

  // Restricted: finished && online && whitelist.enabled
  public getRestrictedEntities = (): IEntity[] =>
    (this.userData?.data?.entity).filter(
      entity =>
        isResolved(entity) &&
        isEntity(entity) &&
        entity.finished &&
        entity.online &&
        entity.whitelist.enabled,
    ) ?? [];

  // Private: finished && !online
  public getPrivateEntities = (): IEntity[] =>
    (this.userData?.data?.entity).filter(
      entity =>
        isEntity(entity) &&
        isResolved(entity) &&
        entity.finished &&
        !entity.online,
    ) ?? [];

  // Unfinished: !finished
  public getUnfinishedEntities = (): IEntity[] =>
    this.userData?.data?.entity.filter(
      entity => isEntity(entity) && isResolved(entity) && !entity.finished,
    ) ?? [];

  public openEntitySettings(entity: IEntity) {
    const dialogRef = this.dialog.open(EntitySettingsDialogComponent, {
      data: entity,
      disableClose: true,
    });
    dialogRef
      .afterClosed()
      .toPromise()
      .then(result => {
        // Replace old entity with new entity
        if (result && this.userData && this.userData.data.entity) {
          const index = (this.userData.data.entity as IEntity[]).findIndex(
            _en => result._id === _en._id,
          );
          if (index === -1) return;
          this.userData.data.entity.splice(index, 1, result as IEntity);
        }
      });
  }

  public editViewerSettings(entity: IEntity) {
    this.dialogHelper.editSettingsInViewer(entity);
  }

  public continueEntityUpload(entity: IEntity) {
    this.editEntity(entity);
  }

  public openEntityOwnerSelection(entity: IEntity) {
    const dialogRef = this.dialog.open(EntityRightsDialogComponent, {
      data: entity,
      disableClose: false,
    });
  }

  public editEntity(entity: IEntity) {
    const dialogRef = this.dialog.open(AddEntityWizardComponent, {
      data: entity,
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
          this.updateFilter();
        }
      });
  }

  public async removeEntity(entity: IEntity) {
    // Get confirmation
    const confirmDialog = this.dialog.open(ConfirmationDialogComponent, {
      data: `Do you really want to delete ${entity.name}?`,
    });
    let result = await confirmDialog
      .afterClosed()
      .toPromise()
      .then(_r => _r);

    // Get and cache login data
    if (!this.account.loginData.isCached) {
      const loginDialog = this.dialog.open(AuthDialogComponent, {
        data: `Validate login before deleting: ${entity.name}`,
        disableClose: true,
      });
      result = await loginDialog
        .afterClosed()
        .toPromise()
        .then(_r => _r);
    }
    if (!result) return;

    // Delete
    if (this.account.loginData.isCached) {
      this.backend
        .deleteRequest(
          entity._id,
          'entity',
          this.account.loginData.username,
          this.account.loginData.password,
        )
        .then(result => {
          if (this.userData?.data?.entity) {
            this.userData.data.entity = (this.userData.data
              .entity as IEntity[]).filter(_e => _e._id !== entity._id);
            this.updateFilter();
          }
        })
        .catch(e => console.error(e));
    }
  }

  // Groups
  public getUserGroups = () =>
    this.userData && this.userData.data.group ? this.userData.data.group : [];

  public getPartakingGroups = () => this.partakingGroups;

  public openGroupCreation(group?: IGroup) {
    const dialogRef = this.dialog.open(AddGroupWizardComponent, {
      data: group ? group : undefined,
      disableClose: true,
    });
    dialogRef
      .afterClosed()
      .toPromise()
      .then((result: undefined | IGroup) => {
        if (!result) return;
        if (!this.userData) return;
        // Add new group to list
        this.userData.data.group = this.userData.data.group
          ? [...this.userData.data.group, result]
          : [result];
      });
  }

  public openMemberList(group: IGroup) {
    const dialogRef = this.dialog.open(GroupMemberDialogComponent, {
      data: group,
    });
  }

  public async removeGroupDialog(group: IGroup) {
    const confirmDialog = this.dialog.open(ConfirmationDialogComponent, {
      data: `Do you really want to delete ${group.name}?`,
    });
    // Get confirmation
    let result = await confirmDialog
      .afterClosed()
      .toPromise()
      .then(_r => _r);
    if (!result) return;

    // Get and cache login data
    if (!this.account.loginData.isCached) {
      const loginDialog = this.dialog.open(AuthDialogComponent, {
        data: `Validate login before deleting: ${group.name}`,
        disableClose: true,
      });
      result = await loginDialog
        .afterClosed()
        .toPromise()
        .then(_r => _r);
    }

    if (!result) return;

    // Delete
    if (this.account.loginData.isCached) {
      this.backend
        .deleteRequest(
          group._id,
          'group',
          this.account.loginData.username,
          this.account.loginData.password,
        )
        .then(result => {
          if (this.userData?.data?.group) {
            this.userData.data.group = (this.userData.data
              .group as IGroup[]).filter(_g => _g._id !== group._id);
          }
        })
        .catch(e => console.error(e));
    }
  }

  public leaveGroupDialog(group: IGroup) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: `Do you really want to leave ${group.name}?`,
    });
    dialogRef
      .afterClosed()
      .toPromise()
      .then(result => {
        if (result) {
          // TODO: leave
          console.log('Leave', group);
        }
      });
  }

  // Compilations
  public getUserCompilations = () =>
    this.userData && this.userData.data.compilation
      ? (this.userData.data.compilation as ICompilation[])
      : [];

  public getPartakingCompilations = () => this.partakingCompilations;

  public openCompilationCreation(compilation?: ICompilation) {
    const dialogRef = this.dialog.open(AddCompilationWizardComponent, {
      data: compilation ? compilation : undefined,
      disableClose: true,
    });
    dialogRef
      .afterClosed()
      .toPromise()
      .then((result: undefined | ICompilation) => {
        if (result && this.userData && this.userData.data.compilation) {
          if (compilation) {
            const index = (this.userData.data
              .compilation as ICompilation[]).findIndex(
              comp => comp._id === result._id,
            );
            if (index === -1) return;
            this.userData.data.compilation.splice(index, 1, result);
          } else {
            (this.userData.data.compilation as ICompilation[]).push(result);
          }
        }
      });
  }

  public async removeCompilationDialog(compilation: ICompilation) {
    const confirmDialog = this.dialog.open(ConfirmationDialogComponent, {
      data: `Do you really want to delete ${compilation.name}?`,
    });
    // Get confirmation
    let result = await confirmDialog
      .afterClosed()
      .toPromise()
      .then(_r => _r);
    if (!result) return;

    // Get and cache login data
    if (!this.account.loginData.isCached) {
      const loginDialog = this.dialog.open(AuthDialogComponent, {
        data: `Validate login before deleting: ${compilation.name}`,
        disableClose: true,
      });
      result = await loginDialog
        .afterClosed()
        .toPromise()
        .then(_r => _r);
    }

    if (!result) return;

    // Delete
    if (this.account.loginData.isCached) {
      this.backend
        .deleteRequest(
          compilation._id,
          'compilation',
          this.account.loginData.username,
          this.account.loginData.password,
        )
        .then(result => {
          if (this.userData?.data?.compilation) {
            this.userData.data.compilation = (this.userData.data
              .compilation as ICompilation[]).filter(
              comp => comp._id !== compilation._id,
            );
          }
        })
        .catch(e => console.error(e));
    }
  }

  public openHelp() {
    this.dialog.open(ProfilePageHelpComponent);
  }

  ngOnInit() {
    this.titleService.setTitle(`Kompakkt – Profile`);
  }
}
