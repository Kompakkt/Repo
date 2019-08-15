import { Component, OnInit } from '@angular/core';
import { MatCheckboxChange, MatDialog } from '@angular/material';
import { Router } from '@angular/router';

import {
  ICompilation,
  IEntity,
  IGroup,
  ILDAPData,
  IMetaDataDigitalEntity,
} from '../../interfaces';
import { AccountService } from '../../services/account.service';
import { MongoHandlerService } from '../../services/mongo-handler.service';
import { EntitySettingsDialogComponent } from '../dialogs/entity-settings-dialog/entity-settings-dialog.component';
import { GroupMemberDialogComponent } from '../dialogs/group-member-dialog/group-member-dialog.component';
import { ConfirmationDialogComponent } from '../dialogs/confirmation-dialog/confirmation-dialog.component';
import { EntityRightsDialogComponent } from '../dialogs/entity-rights-dialog/entity-rights-dialog.component';
import { AuthDialogComponent } from '../auth-dialog/auth-dialog.component';
import { AddGroupWizardComponent } from '../wizards/add-group-wizard/add-group-wizard.component';
import { AddCompilationWizardComponent } from '../wizards/add-compilation/add-compilation-wizard.component';
import { AddEntityWizardComponent } from '../wizards/add-entity/add-entity-wizard.component';

@Component({
  selector: 'app-profile-page',
  templateUrl: './profile-page.component.html',
  styleUrls: ['./profile-page.component.scss'],
})
export class ProfilePageComponent implements OnInit {
  public userData: ILDAPData | undefined;

  public filter = {
    public: true,
    private: true,
    restricted: true,
    unfinished: true,
  };
  public filteredEntities: IEntity[] = [];
  public filteredCompilations: ICompilation[] = [];
  public filteredGroups: IGroup[] = [];

  public showPartakingGroups = false;
  public showPartakingCompilations = false;

  private partakingGroups: IGroup[] = [];
  private partakingCompilations: ICompilation[] = [];

  constructor(
    private account: AccountService,
    private dialog: MatDialog,
    private mongo: MongoHandlerService,
    private router: Router,
  ) {
    this.account.userDataObservable.subscribe(newData => {
      this.userData = newData;
      console.log('Userdata received in ProfilePageComponent', this.userData);
      if (!this.userData) return;
      this.mongo
        .findUserInGroups()
        .then(result => {
          if (result.status === 'ok') {
            this.partakingGroups = result.groups;
          } else {
            throw new Error(result.message);
          }
        })
        .catch(e => console.error(e));

      this.mongo
        .findUserInCompilations()
        .then(result => {
          if (result.status === 'ok') {
            this.partakingCompilations = result.compilations;
          } else {
            throw new Error(result.message);
          }
        })
        .catch(e => console.error(e));
      this.updateFilter();
    });
  }

  public updateFilter = () => {
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

    this.filteredEntities = Array.from(new Set(updatedList));
  };

  // Entities
  // Public: finished && online && !whitelist.enabled
  public getPublicEntities = () =>
    this.userData && this.userData.data.entity
      ? (this.userData.data.entity as IEntity[]).filter(
          entity =>
            entity.finished && entity.online && !entity.whitelist.enabled,
        )
      : [];

  // Restricted: finished && online && whitelist.enabled
  public getRestrictedEntities = () =>
    this.userData && this.userData.data.entity
      ? (this.userData.data.entity as IEntity[]).filter(
          entity =>
            entity.finished && entity.online && entity.whitelist.enabled,
        )
      : [];

  // Private: finished && !online
  public getPrivateEntities = () =>
    this.userData && this.userData.data.entity
      ? (this.userData.data.entity as IEntity[]).filter(
          entity => entity.finished && !entity.online,
        )
      : [];

  // Unfinished: !finished
  public getUnfinishedEntities = () =>
    this.userData && this.userData.data.entity
      ? (this.userData.data.entity as IEntity[]).filter(
          entity => !entity.finished,
        )
      : [];

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

  public navigateToEntity(entity: IEntity) {
    this.router
      .navigate([`entity/${entity._id}`])
      .then(() => {})
      .catch(() => {});
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
    const confirmDialog = this.dialog.open(ConfirmationDialogComponent, {
      data: `Do you really want to delete ${entity.name}?`,
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
      this.mongo
        .deleteRequest(
          entity._id,
          'entity',
          this.account.loginData.username,
          this.account.loginData.password,
        )
        .then(result => {
          if (
            result.status === 'ok' &&
            this.userData &&
            this.userData.data.entity
          ) {
            this.userData.data.entity = (this.userData.data
              .entity as IEntity[]).filter(_e => _e._id !== entity._id);
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
      this.mongo
        .deleteRequest(
          group._id,
          'group',
          this.account.loginData.username,
          this.account.loginData.password,
        )
        .then(result => {
          if (
            result.status === 'ok' &&
            this.userData &&
            this.userData.data.group
          ) {
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
      this.mongo
        .deleteRequest(
          compilation._id,
          'compilation',
          this.account.loginData.username,
          this.account.loginData.password,
        )
        .then(result => {
          if (
            result.status === 'ok' &&
            this.userData &&
            this.userData.data.compilation
          ) {
            this.userData.data.compilation = (this.userData.data
              .compilation as ICompilation[]).filter(
              comp => comp._id !== compilation._id,
            );
          }
        })
        .catch(e => console.error(e));
    }
  }

  ngOnInit() {}
}
