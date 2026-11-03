import { Component, computed, effect, inject, input, signal, model, resource } from '@angular/core';
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

import {
  Collection,
  EntityAccessRole,
  ICompilation,
  IEntity,
  isCompilation,
  isEntity,
  IStrippedUserData,
} from '@kompakkt/common';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { OutlinedInputComponent } from 'src/app/components/outlined-input/outlined-input.component';
import { ExtenderTransformer } from '@kompakkt/plugins/extender';
import { toObservable } from '@angular/core/rxjs-interop';
import { ExtenderSlotDirective } from 'src/app/directives/extender-slot.directive';
import { PermissionService } from 'src/app/services/permissions.service';
import { form, FormField } from '@angular/forms/signals';
import { BackendService } from 'src/app/services/backend.service';
import { AccountService } from 'src/app/services/account.service';
import { DialogHelperService } from 'src/app/services/dialog-helper.service';

export type ChangedVisibilitySettings = Pick<IEntity, 'access' | 'options' | 'online'>;

@Component({
  selector: 'app-visibility-and-access-dialog',
  templateUrl: './visibility-and-access-dialog.component.html',
  styleUrls: ['./visibility-and-access-dialog.component.scss'],
  imports: [
    FormField,
    MatSlideToggleModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatOptionModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    TranslatePipe,
    MatDividerModule,
    MatSelectModule,
    MatDialogModule,
    OutlinedInputComponent,
    ExtenderSlotDirective,
  ],
})
export class VisibilityAndAccessDialogComponent {
  #dialogRef = inject(MatDialogRef<VisibilityAndAccessDialogComponent>, {
    optional: true,
  });
  #backend = inject(BackendService);
  #account = inject(AccountService);
  #helper = inject(DialogHelperService);
  #permission = inject(PermissionService);

  public embedded = input(false);

  // If the dialog is used as part of the upload process, we recieve input data instead of mat dialog data.
  public inputData = input<IEntity[] | ICompilation[] | undefined>();
  public dialogData = inject<IEntity[] | ICompilation[] | undefined>(MAT_DIALOG_DATA, {
    optional: true,
  });
  public element = computed(() => (this.embedded() ? this.inputData() : this.dialogData));
  public elementType = computed(() => {
    const element = this.element()?.at(0);
    if (!element) return undefined;
    return isEntity(element) ? 'entity' : isCompilation(element) ? 'compilation' : undefined;
  });
  public componentType = computed(() => (this.embedded() ? 'component' : 'dialog'));

  public data = signal<IEntity[] | ICompilation[] | undefined>(undefined);
  public isMulti = computed(() => {
    const data = this.data();
    return data && data.length > 1;
  });
  public dataAsObservable$ = toObservable(this.data);
  public entityCount = computed(() => this.data()?.length ?? null);
  public isCompilationEmpty = computed(() => {
    const type = this.elementType();
    if (type !== 'compilation') return false;
    const data = this.data();
    if (!data) return false;
    let isEmpty = true;
    for (const element of data) {
      if (!isCompilation(element)) continue;
      if (Object.keys(element.entities ?? {}).length > 0) {
        isEmpty = false;
        break;
      }
    }
    return isEmpty;
  });

  public canEditVisibilityAndAccess = computed(() =>
    this.#permission.canEditVisibilityAndAccess(this.data()),
  );

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

  searchModel = model('');
  searchForm = form(this.searchModel);

  public roleOptions = signal<Array<{ value: string; label: string }>>([
    { value: EntityAccessRole.editor, label: 'Editor' },
    { value: EntityAccessRole.viewer, label: 'Viewer' },
  ]);

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

  #allAccountsResource = resource({ loader: () => this.#backend.getAccounts() });
  filteredAccounts = computed(() => {
    const query = this.searchForm().value().trim().toLowerCase();
    const accounts = this.#allAccountsResource.hasValue() ? this.#allAccountsResource.value() : [];
    const user = this.#account.user();
    return query.length >= 1
      ? accounts.filter(
          account =>
            account._id !== user?._id &&
            Object.values(account).join('').toLowerCase().includes(query),
        )
      : [];
  });

  public published = signal(false);
  public download = signal(false);

  async togglePublished(checked: boolean) {
    if (!this.data) return;
    this.published.set(checked);
  }

  async toggleDownload(checked: boolean) {
    if (!this.data) return;
    this.download.set(checked);
  }

  constructor() {
    effect(
      () => {
        const element = this.element();
        if (!element) return;
        const cloned = structuredClone(element);
        this.data.set(cloned);
        this.published.set(cloned.every(el => !!el.online));
        this.download.set(cloned.every(el => (isEntity(el) ? el.options?.allowDownload : false)));
      },
      { allowSignalWrites: true },
    );
  }

  public userSelected(event: MatAutocompleteSelectedEvent) {
    this.searchForm().value.set('');
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

  async updateUserRole(role: MatSelectChange, userId: string) {
    const accounts = await this.#backend.getAccounts();
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
    this.#dialogRef?.close(false);
  }

  async save() {
    if (this.data()) {
      const loginData = await this.#helper.verifyAuthentication('Validate login before saving');
      if (!loginData) return;
    }

    this.data.update(data => {
      if (data) {
        data.forEach((element: IEntity | ICompilation) => {
          element.online = this.published();
          if (isEntity(element)) {
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

      // Apply transformations from plugins if necessary
      for (let i = 0; i < data.length; i++) {
        const element = data[i];
        if (!isEntity(element)) continue;
        const transformed = await ExtenderTransformer.applyTransformations(
          Collection.entity,
          element,
        );
        if (!isEntity(transformed)) continue;
        console.info('Applied transformations for entity', element._id, transformed);
        data[i] = transformed;
      }

      const savePromises = data.map((element: IEntity | ICompilation) =>
        isEntity(element)
          ? this.#backend.pushEntity(element)
          : this.#backend.pushCompilation(element),
      );
      await Promise.all(savePromises);

      this.#dialogRef?.close(data);
    } catch (error) {
      console.error('Entity could not be saved: ', error);
    }
  }
}
