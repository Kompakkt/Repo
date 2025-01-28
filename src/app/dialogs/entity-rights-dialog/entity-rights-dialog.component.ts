import { Component, inject, Inject, OnInit } from '@angular/core';
import {
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';
import { MAT_DIALOG_DATA, MatDialog, MatDialogClose } from '@angular/material/dialog';

import { MatIconButton } from '@angular/material/button';
import { MatOption } from '@angular/material/core';
import { MatFormField } from '@angular/material/form-field';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatList, MatListItem, MatListModule } from '@angular/material/list';
import { AccountService, BackendService, DialogHelperService } from 'src/app/services';
import { IEntity, IStrippedUserData } from 'src/common';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { MatSelectModule } from '@angular/material/select';
import {
  BehaviorSubject,
  catchError,
  combineLatestWith,
  filter,
  from,
  map,
  of,
  startWith,
  switchMap,
} from 'rxjs';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-entity-rights-dialog',
  templateUrl: './entity-rights-dialog.component.html',
  styleUrls: ['./entity-rights-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconButton,
    MatDialogClose,
    MatIconModule,
    MatFormField,
    MatInputModule,
    MatAutocompleteModule,
    MatSelectModule,
    MatTooltipModule,
    TranslatePipe,
  ],
})
export class EntityRightsDialogComponent implements OnInit {
  private dialog = inject(MatDialog);
  private data = inject<IEntity | undefined>(MAT_DIALOG_DATA);
  private backend = inject(BackendService);
  private account = inject(AccountService);
  private helper = inject(DialogHelperService);

  public searchControl = new FormControl('');

  public entity$ = new BehaviorSubject<IEntity | undefined>(undefined);
  private entityOwnerChanges$ = new BehaviorSubject<
    {
      action: 'add' | 'remove';
      user: IStrippedUserData;
    }[]
  >([]);
  public entityOwners$ = this.entity$.pipe(
    filter((obj): obj is IEntity => !!obj?._id),
    switchMap(({ _id }) => this.backend.findEntityOwners(_id.toString())),
    catchError(err => {
      console.error('Failed fetching entity owners', err);
      return of<IStrippedUserData[]>([]);
    }),
    combineLatestWith(this.entityOwnerChanges$),
    map(([owners, changes]) => {
      changes.forEach(({ action, user }) => {
        if (action === 'add') owners.push(user);
        else owners = owners.filter(_u => _u._id !== user._id);
      });
      return owners;
    }),
  );
  public strippedUser$ = this.account.strippedUser$;

  public allAccounts$ = from(this.backend.getAccounts()).pipe(
    catchError(err => {
      console.error('Failed fetching accounts', err);
      return of<IStrippedUserData[]>([]);
    }),
  );
  public filteredAccounts$ = this.allAccounts$.pipe(
    combineLatestWith(
      this.searchControl.valueChanges.pipe(
        startWith(''),
        map(value => value?.toLowerCase().trim() ?? ''),
      ),
      this.entityOwners$,
    ),
    map(([accounts, search, currentOwners]) =>
      accounts
        .filter(account => !currentOwners.some(owner => owner._id === account._id))
        .filter(account => Object.values(account).join('').toLowerCase().includes(search)),
    ),
  );

  public async userSelected(event: MatAutocompleteSelectedEvent) {
    console.log(event.source);

    const entity = this.entity$.getValue();
    if (!entity) return;

    const newUser = event.option.value;
    const loginData = await this.helper.confirmWithAuth(
      `Do you really want to add ${newUser.fullname} as owner?`,
      `Validate login before adding ${newUser.fullname} as owner`,
    );
    if (!loginData) return;

    console.log(newUser);
    const { username, password } = loginData;

    const success = await this.backend
      .addEntityOwner(username, password, entity._id, newUser.username)
      .then(() => true)
      .catch(e => {
        console.error('Failed adding owner', e);
        return false;
      });
    if (!success) return;
    this.entityOwnerChanges$.next(
      this.entityOwnerChanges$.getValue().concat({
        action: 'add',
        user: newUser,
      }),
    );
  }

  public async removeUser(user: IStrippedUserData) {
    const entity = this.entity$.getValue();
    if (!entity) return;

    const loginData = await this.helper.confirmWithAuth(
      `Do you really want to remove ${user.fullname} from owners?`,
      `Validate login before removing ${user.fullname} from owners`,
    );
    if (!loginData) return;
    const { username, password } = loginData;

    const success = await this.backend
      .removeEntityOwner(username, password, entity._id, user.username)
      .then(() => true)
      .catch(e => {
        console.error('Failed removing owner', e);
        return false;
      });
    if (!success) return;
    this.entityOwnerChanges$.next(
      this.entityOwnerChanges$.getValue().concat({
        action: 'remove',
        user,
      }),
    );
  }

  ngOnInit() {
    if (this.data) this.entity$.next(this.data);
  }
}
