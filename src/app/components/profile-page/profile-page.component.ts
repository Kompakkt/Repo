import { Component, OnInit } from '@angular/core';
import { MatCheckboxChange, MatDialog } from '@angular/material';

import {
  ICompilation,
  IEntity,
  IGroup,
  ILDAPData,
  IMetaDataDigitalEntity,
} from '../../interfaces';
import { AccountService } from '../../services/account.service';
import { EntitySettingsDialogComponent } from '../dialogs/entity-settings-dialog/entity-settings-dialog.component';
import { AddGroupWizardComponent } from '../wizards/add-group-wizard/add-group-wizard.component';

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

  constructor(private account: AccountService, private dialog: MatDialog) {
    this.account.userDataObservable.subscribe(newData => {
      this.userData = newData;
      console.log('Userdata received in ProfilePageComponent', this.userData);
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

    console.log(updatedList, this.userData, this.filter);
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

  public openGroupCreation(group?: IGroup) {
    const dialogRef = this.dialog.open(AddGroupWizardComponent, {
      data: group ? group : undefined,
      disableClose: true,
    });
    console.log(dialogRef, group);
  }

  // Groups
  public getUserGroups = () =>
    this.userData && this.userData.data.group ? this.userData.data.group : [];

  public getPartakingGroups = () => [];

  // Compilations
  public getUserCompilations = () =>
    this.userData && this.userData.data.compilation
      ? (this.userData.data.compilation as ICompilation[])
      : [];

  public getPartakingCompilations = () => [];

  ngOnInit() {}
}
