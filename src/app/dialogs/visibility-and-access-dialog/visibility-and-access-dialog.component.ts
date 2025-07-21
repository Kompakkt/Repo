import { Component, inject, Inject, OnInit } from '@angular/core';

import {
  MatAutocomplete,
  MatAutocompleteSelectedEvent,
  MatAutocompleteTrigger,
} from '@angular/material/autocomplete';
import { MatDividerModule } from '@angular/material/divider';
import { MatSelect, MatSelectChange } from '@angular/material/select';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog, MatDialogClose } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatOption } from '@angular/material/core';
import { MatFormField } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';

import { BackendService, AccountService, DialogHelperService } from 'src/app/services';
import { IEntity, IStrippedUserData, isEntity } from 'src/common';
import { TranslatePipe } from '../../pipes/translate.pipe';
import {
  BehaviorSubject,
  catchError,
  combineLatestWith,
  filter,
  firstValueFrom,
  from,
  map,
  of,
  startWith,
  switchMap,
  tap,
} from 'rxjs';

@Component({
  selector: 'visibility-and-access-dialog',
  templateUrl: './visibility-and-access-dialog.component.html',
  styleUrls: ['./visibility-and-access-dialog.component.scss'],
  standalone: true,
  imports: [
    MatSlideToggle,
    FormsModule,
    MatFormField,
    ReactiveFormsModule,
    MatInputModule,
    MatAutocompleteTrigger,
    MatAutocomplete,
    MatOption,
    MatButtonModule,
    MatIcon,
    MatTooltipModule,
    TranslatePipe,
    MatDividerModule,
    MatSelect,
    CommonModule,
    MatDialogClose,
  ],
})
export class VisibilityAndAccessDialogComponent implements OnInit {
  private data: IEntity = structuredClone(this.element);
  private backend = inject(BackendService);
  private account = inject(AccountService);
  private helper = inject(DialogHelperService);
  public isEntity = isEntity;
  public isSubmitting = false;
  public entityOwner;
  public isMulti: boolean = false;
  public multiEntityTooltip: string = '';

  public searchControl = new FormControl('');
  public ownersForm = new FormGroup({});

  public roleOptions = [
    { value: 'editor', label: 'Editor' },
    { value: 'viewer', label: 'Viewer' },
  ];
  public ownerRole = 'Owner';
  public entity$ = new BehaviorSubject<IEntity | undefined>(undefined);

  public accessPersons$ = new BehaviorSubject<
    (IStrippedUserData & {
      role: 'owner' | 'editor' | 'viewer';
      elementId: string;
      displayRole: string;
    })[]
  >(this.getInitialAccess());

  public entityOwner$ = this.accessPersons$.pipe(
    map(array => array.find(user => user.role === 'owner') ?? null),
    catchError(err => {
      console.error('Failed fetching entity owner', err);
      return of(null);
    }),
  );

  public accessPersonsArray$ = this.accessPersons$.pipe(
    map(data => {
      if (data) {
        const accessArray = Object.values(data);
        this.entityOwner = this.getCurrentEntityOwner(accessArray);
        return accessArray;
      }
      return [];
    }),
  );

  private getInitialAccess() {
    if (Array.isArray(this.data)) {
      return this.getMultiAccessArray(this.data);
    } else if (this.data?.access) {
      const values = Object.values(this.data.access);
      return values.map(user => ({
        ...user,
        elementId: (this.data as any)._id ?? '',
        displayRole: user.role,
      }));
    }

    return [];
  }

  private getMultiAccessArray(element: IEntity<Record<string, unknown>>[]) {
    const allUsers = element.flatMap(entity => {
      const values = Object.values(entity.access ?? {}) as (IStrippedUserData & {
        role: 'owner' | 'editor' | 'viewer';
      })[];

      return values.map(user => ({
        ...user,
        elementId: (entity as any).id ?? null,
      }));
    });

    const userMap: Record<
      string,
      {
        user: IStrippedUserData & { role: 'owner' | 'editor' | 'viewer' };
        roles: Set<'owner' | 'editor' | 'viewer'>;
        elementId: any;
        occurrences: number;
      }
    > = {};

    allUsers.forEach(user => {
      const key = user.username;
      if (!userMap[key]) {
        userMap[key] = {
          user,
          roles: new Set([user.role]),
          elementId: user.elementId,
          occurrences: 1,
        };
      } else {
        userMap[key].roles.add(user.role);
        userMap[key].occurrences += 1;
      }
    });

    const totalEntities = element.length;

    const deduplicatedUsersWithDisplayRole = Object.values(userMap).map(entry => {
      const isMixed = entry.roles.size > 1 || entry.occurrences < totalEntities;
      return {
        ...entry.user,
        elementId: entry.elementId,
        displayRole: isMixed ? 'mixed' : [...entry.roles][0],
      };
    });

    return deduplicatedUsersWithDisplayRole;
  }

  private updateAccessPersons() {
    const updated = this.getInitialAccess();
    this.accessPersons$.next(updated);
  }

  public getCurrentEntityOwner(accessArray) {
    return accessArray.find(access => access.role === 'owner');
  }

  public getEntityCount() {
    if (Array.isArray(this.data)) return this.data.length;

    return null;
  }

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
    private dialogRef: MatDialogRef<VisibilityAndAccessDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public element: IEntity,
  ) {}

  public published = false;

  public async togglePublished(checked: boolean) {
    if (!this.data) return;
    this.published = checked;
  }

  public async userSelected(event: MatAutocompleteSelectedEvent) {
    const newUser = event.option.value;

    const currentAccess = this.accessPersons$.getValue();
    const exist = currentAccess.some(user => user.username === newUser.username);
    if (exist) return;

    newUser.role = 'viewer';

    if (Array.isArray(this.data)) {
      this.data.forEach(entity => {
        entity.access[newUser._id] = newUser;
      });
    } else {
      this.data.access![newUser._id] = newUser;
    }
    this.updateAccessPersons();
  }

  public async updateUserRole(role: MatSelectChange, id: string) {
    if (this.isMulti && Array.isArray(this.data)) {
      let updatedUser;

      await this.backend.getAccounts().then(accounts => {
        updatedUser = accounts.find(user => user._id === id);
        updatedUser.role = role.value;
      });

      this.data.forEach(entity => {
        entity.access[id] = updatedUser;
      });
    } else {
      this.data.access![id].role = role.value;
    }
    this.updateAccessPersons();
  }

  public async removeUser(user: IStrippedUserData) {
    if (Array.isArray(this.data)) {
      this.data.forEach(entity => {
        delete entity.access![user._id];
      });
    } else {
      delete this.data.access![user._id];
    }

    this.updateAccessPersons();
  }

  public cancel() {
    this.dialogRef.close(false);
  }

  public async save() {
    if (this.data) {
      const loginData = await this.helper.verifyAuthentication('Validate login before saving');
      if (!loginData) return;
    }

    if (Array.isArray(this.data)) {
      this.data.forEach(entity => {
        entity.online = this.published;
      });
    } else {
      this.data.online = this.published;
    }

    try {
      if (Array.isArray(this.data)) {
        const savePromises = this.data.map(entity => this.pushToBackend(entity));
        await Promise.all(savePromises);
      } else {
        await this.pushToBackend(this.data);
      }

      this.dialogRef.close(this.data);
    } catch (error) {
      console.error('Entity could not be saved: ', error);
    }
  }

  private async pushToBackend(entity: IEntity) {
    this.backend.pushEntity(entity);
  }

  ngOnInit() {
    if (this.data) {
      this.published = Array.isArray(this.data)
        ? this.data.every(el => el.online)
        : (this.data?.online ?? false);

      if (Array.isArray(this.data)) {
        this.isMulti = true;
        this.data.forEach(entity => {
          this.multiEntityTooltip = this.multiEntityTooltip + entity.name + '\n';
        });
      }
    }
  }
}
