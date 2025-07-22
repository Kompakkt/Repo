import { Component, inject, Inject, signal } from '@angular/core';
import {
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

import { CommonModule } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule, MatIconButton } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BehaviorSubject, catchError, combineLatestWith, from, map, of, startWith } from 'rxjs';
import { AccountService, BackendService, DialogHelperService } from 'src/app/services';
import { IEntity, IStrippedUserData } from 'src/common';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-manage-ownership',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconButton,
    MatDialogModule,
    MatIconModule,
    MatInputModule,
    MatAutocompleteModule,
    MatSelectModule,
    MatTooltipModule,
    TranslatePipe,
  ],
  templateUrl: './manage-ownership.component.html',
  styleUrl: './manage-ownership.component.scss',
})
export class ManageOwnershipComponent {
  private data: IEntity = structuredClone(this.element);
  private backend = inject(BackendService);
  private account = inject(AccountService);
  private helper = inject(DialogHelperService);

  public searchControl = new FormControl('');
  public searchFocused = false;

  public isMulti: boolean = false;
  public multiEntityTooltip: string = '';
  public targetOwner = signal<IStrippedUserData | undefined>(undefined);

  public entity$ = new BehaviorSubject<IEntity | undefined>(undefined);

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
        map(value => (typeof value === 'string' ? value.toLowerCase().trim() : '')),
      ),
    ),
    map(([accounts, search]) =>
      accounts.filter(account => Object.values(account).join('').toLowerCase().includes(search)),
    ),
  );

  constructor(
    private dialogRef: MatDialogRef<ManageOwnershipComponent>,
    @Inject(MAT_DIALOG_DATA)
    public element: IEntity,
  ) {
    console.log(this.element);
  }

  public getEntityCount() {
    if (Array.isArray(this.data)) return this.data.length;

    return null;
  }

  public async userSelected(event: MatAutocompleteSelectedEvent) {
    const newOwner = event.option.value;
    this.targetOwner.set(newOwner);
  }

  public async removeUser() {
    this.targetOwner.set(undefined);
  }

  public async transferUser() {
    if (this.data) {
      console.log(this.data);

      if (!this.targetOwner()) return;

      const loginData = await this.helper.verifyAuthentication('Validate login before saving');
      if (!loginData) return;

      try {
        if (Array.isArray(this.data)) {
          const savePromises = this.data.map(entity => this.saveNewOwner(entity._id));
          await Promise.all(savePromises);
        } else {
          await this.saveNewOwner(this.data._id);
        }

        this.dialogRef.close(this.element);
      } catch (error) {
        console.error('Owner could not be transfered: ', error);
      }
    }
  }

  private async saveNewOwner(entityId: string) {
    return this.backend.transferOwnerShip(entityId, this.targetOwner()?._id);
  }

  public cancel() {
    this.dialogRef.close(false);
  }

  async ngOnInit() {
    this.entity$.next(this.data);

    this.backend.findEntitiesWithAccessRole('owner').then(result => {
      console.log(result);
    });

    if (this.data) {
      if (Array.isArray(this.data)) {
        this.isMulti = true;
        this.data.forEach(entity => {
          this.multiEntityTooltip = this.multiEntityTooltip + entity.name + '\n';
        });
      }
    }
  }
}
