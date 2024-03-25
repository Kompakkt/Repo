import { Component, Inject, OnInit } from '@angular/core';
import {
  MatAutocomplete,
  MatAutocompleteSelectedEvent,
  MatAutocompleteTrigger,
} from '@angular/material/autocomplete';
import { MAT_DIALOG_DATA, MatDialog, MatDialogClose } from '@angular/material/dialog';

import { MatIconButton } from '@angular/material/button';
import { MatOption } from '@angular/material/core';
import { MatFormField } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatList, MatListItem } from '@angular/material/list';
import { AccountService, BackendService, DialogHelperService } from 'src/app/services';
import { IEntity, IStrippedUserData } from 'src/common';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-entity-rights-dialog',
  templateUrl: './entity-rights-dialog.component.html',
  styleUrls: ['./entity-rights-dialog.component.scss'],
  standalone: true,
  imports: [
    MatIconButton,
    MatDialogClose,
    MatIcon,
    MatFormField,
    MatInput,
    MatAutocompleteTrigger,
    MatAutocomplete,
    MatOption,
    MatList,
    MatListItem,
    TranslatePipe,
  ],
})
export class EntityRightsDialogComponent implements OnInit {
  public entity?: IEntity;

  public entityOwners: IStrippedUserData[] = [];
  public strippedUser?: IStrippedUserData;

  public allAccounts: IStrippedUserData[] = [];

  constructor(
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) private data: IEntity | undefined,
    private backend: BackendService,
    private account: AccountService,
    private helper: DialogHelperService,
  ) {
    this.account.strippedUser$.subscribe(strippedUser => {
      this.strippedUser = strippedUser;
    });
    this.backend
      .getAccounts()
      .then(result => (this.allAccounts = result))
      .catch(e => console.error(e));
  }

  public async userSelected(event: MatAutocompleteSelectedEvent) {
    if (!this.strippedUser) return;
    if (!this.entity) return;

    const newUser = event.option.value;
    const loginData = await this.helper.confirmWithAuth(
      `Do you really want to add ${newUser.fullname} as owner?`,
      `Validate login before adding ${newUser.fullname} as owner`,
    );
    if (!loginData) return;

    console.log(newUser);
    const { username, password } = loginData;

    // TODO: handle response
    this.backend
      .addEntityOwner(username, password, this.entity._id, newUser.username)
      .then(response => this.entityOwners.push(newUser))
      .catch(e => console.error(e));
  }

  public async removeUser(user: IStrippedUserData) {
    if (!this.strippedUser) return;
    if (!this.entity) return;

    const loginData = await this.helper.confirmWithAuth(
      `Do you really want to remove ${user.fullname} from owners?`,
      `Validate login before removing ${user.fullname} from owners`,
    );
    if (!loginData) return;
    const { username, password } = loginData;

    // TODO: handle response
    this.backend
      .removeEntityOwner(username, password, this.entity._id, user.username)
      .then(response => {
        this.entityOwners = this.entityOwners.filter(_u => _u._id !== user._id);
      })
      .catch(e => console.error(e));
  }

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
