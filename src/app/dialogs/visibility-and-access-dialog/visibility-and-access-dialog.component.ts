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
import {   EntityAccessRole,
  ICompilation,
  IEntity,
  isCompilation,
  isEntity,
  IStrippedUserData, } from '@kompakkt/common';
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
  public inputData = input<IEntity[] | ICompilation[] | undefined>();
  public dialogData = inject<IEntity[] | ICompilation[] | undefined>(MAT_DIALOG_DATA);
  public element = computed(() => this.inputData() ?? this.dialogData);
  public elementType = computed(() => {
    const element = this.element()?.at(0);
    if (!element) return undefined;
    return isEntity(element) ? 'entity' : isCompilation(element) ? 'compilation' : undefined;
  });
  public componentType = computed(() => (this.inputData() ? 'component' : 'dialog'));

  public data = signal(structuredClone(this.element()));
  public isMulti = computed(() => {
    const data = this.data();
    return data && data.length > 1;
  });
  public entityCount = computed(() => this.data()?.length ?? null);

  public isLastOwner(userId: string): boolean {
    const owners = this.entityOwners();
    return owners.length === 1 && owners[0]._id === userId;
  }

  // This is used in the AddEntityWizard to extract the changed settings
  public changedSettings = computed<ChangedVisibilitySettings>(() => {
    const data = this.data();
    if (!data) return { access: [], options: {}, online: false };
    const access = data.at(0)?.access;
    const published = this.published();
    const download = this.download() ?? false;
    return {
      access: access ?? [],
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
    return data.map(e => e.name).join('\n');
  });

  public searchControl = new FormControl('', { nonNullable: true });

  public roleOptions = computed(() => {
    const elementType = this.elementType();
    const options: Array<{ value: string; label: string }> = [
      { value: EntityAccessRole.editor, label: 'Editor' },
    ];
    if (elementType === 'entity') {
      options.push({ value: EntityAccessRole.viewer, label: 'Viewer' });
    }
    return options;
  });

  public accessPersons = computed(() => {
    const data = this.data();
    if (!data) return [];
    const accessPersons = this.getMultiAccessArray(data);

    return accessPersons.sort((a, b) => {
      const rolePriority = { owner: 0, editor: 1, viewer: 2 };
      const priorityDiff = rolePriority[a.role] - rolePriority[b.role];
      return priorityDiff !== 0 ? priorityDiff : a.username.localeCompare(b.username);
    });
  });
  public entityOwners = computed(() => {
    const accessPersons = this.accessPersons();
    return accessPersons.filter(user => user.role === EntityAccessRole.owner);
  });

  private getMultiAccessArray(element: IEntity[] | ICompilation[]) {
    const allUsers = element.flatMap((el: IEntity | ICompilation) =>
      el.access.map(user => ({
        ...user,
        elementId: el._id,
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
      return data.every(el => (isEntity(el) ? el.online : false));
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
      return data.every(el => (isEntity(el) ? el.options?.allowDownload : false));
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

    const elementType = this.elementType();
    newUser.role = elementType === 'entity' ? EntityAccessRole.viewer : EntityAccessRole.editor;

    console.log('Adding user', newUser, this.data());
    this.data.update(data => {
      if (data) {
        data.forEach((element: IEntity | ICompilation) => {
          const userIndex = element.access.findIndex(u => u._id === newUser._id);
          if (userIndex >= 0) {
            element.access[userIndex] = newUser;
          } else {
            element.access.push(newUser);
          }
        });
        return [...data] as IEntity[] | ICompilation[];
      } else {
        return data;
      }
    });
    console.log('After adding user', this.data());
  }

  public async updateUserRole(role: MatSelectChange, userId: string) {
    const accounts = await this.backend.getAccounts();
    const user = accounts.find(user => user._id === userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    const userWithRole = {
      ...user,
      role: role.value,
    };

    this.data.update(data => {
      if (data) {
        data.forEach((element: IEntity | ICompilation) => {
          const userIndex = element.access.findIndex(u => u._id === userId);
          if (userIndex >= 0) {
            element.access[userIndex] = userWithRole;
          } else {
            element.access.push(userWithRole);
          }
        });
        return [...data] as IEntity[] | ICompilation[];
      } else {
        return data;
      }
    });
  }

  public removeUser(user: IStrippedUserData) {
    this.data.update(data => {
      if (data) {
        data.forEach((element: IEntity | ICompilation) => {
          const userIndex = element.access.findIndex(u => u._id === user._id);
          if (userIndex >= 0) {
            element.access.splice(userIndex, 1);
          }
        });
        return [...data] as IEntity[] | ICompilation[];
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
      if (data) {
        data.forEach((element: IEntity | ICompilation) => {
          if (isEntity(element)) {
            element.online = this.published();
            element.options ??= {};
            element.options.allowDownload = this.download();
          }
        });
        return [...data] as IEntity[] | ICompilation[];
      } else {
        return data;
      }
    });

    try {
      const data = this.data();
      if (!data) throw new Error('No data to save');
      const savePromises = data.map((element: IEntity | ICompilation) =>
        isEntity(element)
          ? this.backend.pushEntity(element)
          : this.backend.pushCompilation(element),
      );
      await Promise.all(savePromises);

      this.dialogRef.close(data);
    } catch (error) {
      console.error('Entity could not be saved: ', error);
    }
  }

  ngAfterViewInit(): void {
    // If we open the component without dialogdata, input is sometimes not available until the component is fully initialized.
    // This is a workaround to ensure that the data is set correctly.
    if (!this.data()) this.data.set(structuredClone(this.element()));
  }
}
