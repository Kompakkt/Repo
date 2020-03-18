import { Component, OnInit, Inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';

import { IEntity, IStrippedUserData } from '../../interfaces';
import { BackendService } from '../../services/backend.service';
import { AccountService } from '../../services/account.service';

import { AuthDialogComponent } from '../../components/auth-dialog/auth-dialog.component';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-entity-rights-dialog',
  templateUrl: './entity-rights-dialog.component.html',
  styleUrls: ['./entity-rights-dialog.component.scss'],
})
export class EntityRightsDialogComponent implements OnInit {
  public entity: IEntity | undefined;

  public entityOwners: IStrippedUserData[] = [];
  public userData: IStrippedUserData | undefined;

  private allAccounts: IStrippedUserData[] = [];

  constructor(
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<EntityRightsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) private data: IEntity | undefined,
    private backend: BackendService,
    private account: AccountService,
  ) {
    this.account.userDataObservable.subscribe(
      result => (this.userData = result),
    );
    this.backend
      .getAccounts()
      .then(result => (this.allAccounts = result))
      .catch(e => console.error(e));
  }

  public userSelected = async (event: MatAutocompleteSelectedEvent) => {
    const newUser = event.option.value;

    let result;

    if (!this.account.loginData.isCached) {
      const loginDialog = this.dialog.open(AuthDialogComponent, {
        data: `Validate login before adding: ${newUser.fullname}`,
        disableClose: true,
      });
      result = await loginDialog
        .afterClosed()
        .toPromise()
        .then(_r => _r);
    }

    console.log(newUser);

    if (this.account.loginData.isCached && this.entity) {
      this.backend
        .addEntityOwner(
          this.account.loginData.username,
          this.account.loginData.password,
          this.entity._id,
          newUser.username,
        )
        .then(response => this.entityOwners.push(newUser))
        .catch(e => console.error(e));
    }
  };

  public removeUser = async (user: IStrippedUserData) => {
    const confirmDialog = this.dialog.open(ConfirmationDialogComponent, {
      data: `Do you really want to remove ${user.fullname} as owner?`,
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
        data: `Validate login before removing: ${user.fullname}`,
        disableClose: true,
      });
      result = await loginDialog
        .afterClosed()
        .toPromise()
        .then(_r => _r);
    }

    if (!result) return;

    if (this.account.loginData.isCached && this.entity) {
      this.backend
        .removeEntityOwner(
          this.account.loginData.username,
          this.account.loginData.password,
          this.entity._id,
          user.username,
        )
        .then(
          response =>
            (this.entityOwners = this.entityOwners.filter(
              _u => _u._id !== user._id,
            )),
        )
        .catch(e => console.error(e));
    }
  };

  ngOnInit() {
    if (this.data) {
      this.entity = this.data;
      this.backend
        .findEntityOwners(this.entity._id)
        .then(accounts => (this.entityOwners = accounts))
        .catch(e => console.error(e));
    }
  }
}
