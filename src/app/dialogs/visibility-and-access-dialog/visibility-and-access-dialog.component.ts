import { Component, computed, inject, Inject, OnInit, signal } from '@angular/core';

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
import { EntityAccessRole, IEntity, IStrippedUserData, isEntity } from 'src/common';
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
export class VisibilityAndAccessDialogComponent {
  private dialogRef = inject(MatDialogRef<VisibilityAndAccessDialogComponent>);
  public element = inject<IEntity | IEntity[]>(MAT_DIALOG_DATA);
  private backend = inject(BackendService);
  private account = inject(AccountService);
  private helper = inject(DialogHelperService);

  public data = signal(structuredClone(this.element));
  public isMulti = computed(() => {
    const data = this.data();
    return Array.isArray(data) && data.length > 1;
  });

  public isSubmitting = false;
  public multiEntityTooltip = computed(() => {
    const data = this.data();
    return Array.isArray(data) ? data.map(e => e.name).join('\n') : data.name;
  });

  public searchControl = new FormControl('', { nonNullable: true });

  public roleOptions = [
    { value: 'editor', label: 'Editor' },
    { value: 'viewer', label: 'Viewer' },
  ];

  public accessPersons = computed(() => {
    const data = this.data();
    const accessPersons = Array.isArray(data)
      ? this.getMultiAccessArray(data)
      : Object.values(data.access ?? {}).map(user => ({
          ...user,
          elementId: data._id,
          displayRole: user.role,
        }));

    return accessPersons.sort((a, b) => {
      const rolePriority = { owner: 0, editor: 1, viewer: 2 };
      const priorityDiff = rolePriority[a.role] - rolePriority[b.role];
      return priorityDiff !== 0 ? priorityDiff : a.username.localeCompare(b.username);
    });
  });
  public entityOwners = computed(() => {
    const accessPersons = this.accessPersons();
    return accessPersons.filter(user => user.role === 'owner');
  });

  private getMultiAccessArray(element: IEntity[]) {
    const allUsers = element.flatMap(entity =>
      Object.values(entity.access ?? {}).map(user => ({
        ...user,
        elementId: entity._id,
      })),
    );

    const userMap: Record<
      string,
      {
        user: IStrippedUserData & { role: EntityAccessRole };
        roles: Set<EntityAccessRole>;
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
      this.account.user$,
    ),
    map(([accounts, search, user]) =>
      accounts.filter(
        account =>
          account._id !== user._id &&
          Object.values(account).join('').toLowerCase().includes(search),
      ),
    ),
  );

  public published = signal(
    (() => {
      const data = this.data();
      return Array.isArray(data) ? data.every(el => el.online) : data.online;
    })(),
  );

  public async togglePublished(checked: boolean) {
    if (!this.data) return;
    this.published.set(checked);
  }

  public userSelected(event: MatAutocompleteSelectedEvent) {
    const newUser = event.option.value;

    const currentAccess = this.accessPersons();
    const exist = currentAccess.some(user => user.username === newUser.username);
    if (exist) return;

    newUser.role = 'viewer';

    console.log('Adding user', newUser, this.data());
    this.data.update(data => {
      if (Array.isArray(data)) {
        data.forEach(entity => {
          entity.access ??= {};
          entity.access[newUser._id] = newUser;
        });
        return [...data];
      } else {
        data.access![newUser._id] = newUser;
        return { ...data };
      }
    });
    console.log('After adding user', this.data());
  }

  public async updateUserRole(role: MatSelectChange, id: string) {
    const accounts = await this.backend.getAccounts();
    const user = accounts.find(user => user._id === id);
    if (!user) {
      throw new Error(`User with ID ${id} not found`);
    }

    const userWithRole = {
      ...user,
      role: role.value,
    };

    this.data.update(data => {
      if (Array.isArray(data)) {
        data.forEach(entity => {
          entity.access ??= {};
          entity.access[id] = userWithRole;
        });
        return [...data];
      } else {
        data.access ??= {};
        data.access[id].role = role.value;
        return { ...data };
      }
    });
  }

  public removeUser(user: IStrippedUserData) {
    this.data.update(data => {
      if (Array.isArray(data)) {
        data.forEach(entity => {
          entity.access ??= {};
          if (Object.hasOwn(entity.access, user._id)) {
            delete entity.access[user._id];
          }
        });
        return [...data];
      } else {
        data.access ??= {};
        if (Object.hasOwn(data.access, user._id)) {
          delete data.access[user._id];
        }
        return { ...data };
      }
    });
  }

  public cancel() {
    this.dialogRef.close(false);
  }

  public async save() {
    if (this.data()) {
      const loginData = await this.helper.verifyAuthentication('Validate login before saving');
      if (!loginData) return;
    }

    this.data.update(data => {
      if (Array.isArray(data)) {
        data.forEach(entity => {
          entity.online = this.published();
        });
        return [...data];
      } else {
        data.online = this.published();
        return { ...data };
      }
    });

    try {
      const data = this.data();
      if (Array.isArray(data)) {
        const savePromises = data.map(entity => this.pushToBackend(entity));
        await Promise.all(savePromises);
      } else {
        await this.pushToBackend(data);
      }

      this.dialogRef.close(this.data);
    } catch (error) {
      console.error('Entity could not be saved: ', error);
    }
  }

  private async pushToBackend(entity: IEntity) {
    this.backend.pushEntity(entity);
  }
}
