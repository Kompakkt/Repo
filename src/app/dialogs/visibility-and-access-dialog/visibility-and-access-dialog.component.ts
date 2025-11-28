import { AfterViewInit, Component, computed, inject, input, signal } from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';

import { catchError, combineLatestWith, from, map, of, startWith } from 'rxjs';
import { AccountService, BackendService, DialogHelperService } from 'src/app/services';
import { EntityAccessRole, IEntity, IStrippedUserData } from 'src/common';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { OutlinedInputComponent } from 'src/app/components/outlined-input/outlined-input.component';

export type ChangedVisibilitySettings = Pick<IEntity, 'access' | 'options' | 'online'>;

@Component({
  selector: 'app-visibility-and-access-dialog',
  templateUrl: './visibility-and-access-dialog.component.html',
  styleUrls: ['./visibility-and-access-dialog.component.scss'],
  standalone: true,
  imports: [
    MatSlideToggleModule,
    FormsModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatInputModule,
    MatAutocompleteModule,
    MatOptionModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    TranslatePipe,
    MatDividerModule,
    MatSelectModule,
    CommonModule,
    MatDialogModule,
    OutlinedInputComponent,
  ],
})
export class VisibilityAndAccessDialogComponent implements AfterViewInit {
  private dialogRef = inject(MatDialogRef<VisibilityAndAccessDialogComponent>);
  private backend = inject(BackendService);
  private account = inject(AccountService);
  private helper = inject(DialogHelperService);

  // If the dialog is used as part of the upload process, we recieve input data instead of mat dialog data.
  public inputData = input<IEntity | IEntity[] | undefined>();
  public dialogData = inject<IEntity | IEntity[] | undefined>(MAT_DIALOG_DATA);
  public element = computed(() => this.inputData() ?? this.dialogData);
  public componentType = computed(() => (this.inputData() ? 'component' : 'dialog'));

  public data = signal(structuredClone(this.element()));
  public isMulti = computed(() => {
    const data = this.data();
    return Array.isArray(data) && data.length > 1;
  });

  // This is used in the AddEntityWizard to extract the changed settings
  public changedSettings = computed<ChangedVisibilitySettings>(() => {
    const data = this.data();
    if (!data) return { access: {}, options: {}, online: false };
    const access = Array.isArray(data) ? data.at(0)?.access : data.access;
    const published = this.published();
    const download = this.download() ?? false;
    return {
      access: access,
      online: published,
      options: {
        allowDownload: download,
      },
    };
  });

  public isSubmitting = false;
  public multiEntityTooltip = computed(() => {
    const data = this.data();
    if (!data) return '';
    return Array.isArray(data) ? data.map(e => e.name).join('\n') : data.name;
  });

  public searchControl = new FormControl('', { nonNullable: true });

  public roleOptions = [
    { value: 'editor', label: 'Editor' },
    { value: 'viewer', label: 'Viewer' },
  ];

  public accessPersons = computed(() => {
    const data = this.data();
    if (!data) return [];
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
      search.length >= 1
        ? accounts.filter(
            account =>
              account._id !== user?._id &&
              Object.values(account).join('').toLowerCase().includes(search),
          )
        : [],
    ),
  );

  public published = signal(
    (() => {
      const data = this.data();
      if (!data) return false;
      return Array.isArray(data) ? data.every(el => el.online) : data.online;
    })(),
  );

  public async togglePublished(checked: boolean) {
    if (!this.data) return;
    this.published.set(checked);
  }

  public download = signal(
    (() => {
      const data = this.data();
      if (!data) return false;
      return Array.isArray(data)
        ? data.every(el => el.options?.allowDownload)
        : data.options?.allowDownload;
    })(),
  );

  public async toggleDownload(checked: boolean) {
    if (!this.data) return;
    this.download.set(checked);
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
      } else if (data) {
        data.access![newUser._id] = newUser;
        return { ...data };
      } else {
        return data;
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
      } else if (data) {
        data.access ??= {};
        data.access[id].role = role.value;
        return { ...data };
      } else {
        return data;
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
      } else if (data) {
        data.access ??= {};
        if (Object.hasOwn(data.access, user._id)) {
          delete data.access[user._id];
        }
        return { ...data };
      } else {
        return data;
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
          entity.options ??= {};
          entity.options.allowDownload = this.download();
        });
        return [...data];
      } else if (data) {
        data.online = this.published();
        data.options ??= {};
        data.options.allowDownload = this.download();
        return { ...data };
      } else {
        return data;
      }
    });

    try {
      const data = this.data();
      if (!data) throw new Error('No data to save');
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

  ngAfterViewInit(): void {
    // If we open the component without dialogdata, input is sometimes not available until the component is fully initialized.
    // This is a workaround to ensure that the data is set correctly.
    if (!this.data()) this.data.set(structuredClone(this.element()));
  }
}
