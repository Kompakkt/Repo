import { Component, computed, inject, signal } from '@angular/core';
import {
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

import { AsyncPipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { catchError, combineLatestWith, from, map, of, startWith } from 'rxjs';
import { AccountService, BackendService, DialogHelperService } from 'src/app/services';
import { Collection, ICompilation, IEntity, isEntity, IStrippedUserData } from '@kompakkt/common';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { OutlinedInputComponent } from 'src/app/components/outlined-input/outlined-input.component';

@Component({
  selector: 'app-manage-ownership',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatInputModule,
    MatAutocompleteModule,
    MatSelectModule,
    MatTooltipModule,
    TranslatePipe,
    OutlinedInputComponent,
    AsyncPipe,
  ],
  templateUrl: './manage-ownership.component.html',
  styleUrl: './manage-ownership.component.scss',
})
export class ManageOwnershipComponent {
  #backend = inject(BackendService);
  #account = inject(AccountService);
  #helper = inject(DialogHelperService);
  #dialogRef = inject(MatDialogRef<ManageOwnershipComponent>);
  element: IEntity | IEntity[] | ICompilation | ICompilation[] = inject(MAT_DIALOG_DATA);
  data = computed(() => {
    const cloned = structuredClone(this.element);
    return Array.isArray(cloned) ? cloned : [cloned];
  });
  isDataEntities = computed(() => isEntity(this.data()[0]));
  docCount = computed(() => {
    const data = this.data();
    return Array.isArray(data) ? data.length : 1;
  });
  isMulti = computed(() => this.docCount() > 1);
  docNames = computed(() =>
    this.data()
      .map(doc => doc.name)
      .join('\n'),
  );

  searchControl = new FormControl('', { nonNullable: true });

  targetOwner = signal<IStrippedUserData | undefined>(undefined);
  currentOwner = toSignal(this.#account.strippedUser$);

  allAccounts$ = from(this.#backend.getAccounts()).pipe(
    catchError(err => {
      console.error('Failed fetching accounts', err);
      return of<IStrippedUserData[]>([]);
    }),
    map(accounts =>
      accounts.map(account => ({
        ...account,
        searchText: [account.fullname, account.username].join('').toLowerCase(),
      })),
    ),
  );
  filteredAccounts$ = this.allAccounts$.pipe(
    combineLatestWith(
      this.searchControl.valueChanges.pipe(
        startWith(''),
        map(value => (typeof value === 'string' ? value.toLowerCase().trim() : '')),
      ),
      this.#account.strippedUser$,
    ),
    map(([accounts, search, user]) =>
      search.length >= 1
        ? accounts.filter(
            account => account._id !== user?._id && account.searchText.includes(search),
          )
        : [],
    ),
  );

  public async userSelected(event: MatAutocompleteSelectedEvent) {
    const newOwner = event.option.value;
    this.targetOwner.set(newOwner);
  }

  public async removeUser() {
    this.targetOwner.set(undefined);
  }

  public async transferUser() {
    const data = this.data();
    const targetOwner = this.targetOwner();

    if (!targetOwner) return;

    const loginData = await this.#helper.verifyAuthentication(
      'Validate login before transferring ownership',
    );
    if (!loginData) return;

    try {
      const savePromises = data.map(doc =>
        this.#backend.transferOwnerShip({
          docId: doc._id,
          targetUserId: targetOwner._id,
          collection: isEntity(doc) ? Collection.entity : Collection.compilation,
        }),
      );
      await Promise.all(savePromises);

      this.#dialogRef.close(data);
    } catch (error) {
      console.error('Owner could not be transfered: ', error);
    }
  }

  public cancel() {
    this.#dialogRef.close(false);
  }
}
