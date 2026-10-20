import { Component, computed, inject, signal } from '@angular/core';
import {
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

import { AsyncPipe } from '@angular/common';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  catchError,
  combineLatest,
  debounce,
  distinctUntilChanged,
  from,
  map,
  of,
  startWith,
  switchMap,
  timer,
} from 'rxjs';
import {
  AccountService,
  BackendService,
  DialogHelperService,
  SnackbarService,
} from 'src/app/services';
import {
  Collection,
  EntityAccessRole,
  ICompilation,
  IEntity,
  IPublicProfile,
  ProfileType,
  isEntity,
} from '@kompakkt/common';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { OutlinedInputComponent } from 'src/app/components/outlined-input/outlined-input.component';
import { getServerUrl } from 'src/app/util/get-server-url';

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
    RouterLink,
  ],
  templateUrl: './manage-ownership.component.html',
  styleUrl: './manage-ownership.component.scss',
})
export class ManageOwnershipComponent {
  #backend = inject(BackendService);
  #account = inject(AccountService);
  #helper = inject(DialogHelperService);
  #snackbar = inject(SnackbarService);
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

  currentOwner = toSignal(this.#account.strippedUser$);
  #ownProfiles = toSignal(this.#account.profiles$, { initialValue: [] as IPublicProfile[] });
  #ownProfiles$ = toObservable(this.#ownProfiles);

  targetProfile = signal<IPublicProfile | undefined>(undefined);
  targetUserId = signal<string | undefined>(undefined);

  #ownerProfileIds = computed(() => {
    const ids = new Set<string>();
    for (const doc of this.data()) {
      const profileId = this.#ownerProfileId(doc);
      if (profileId) ids.add(profileId);
    }
    return ids;
  });
  #ownerProfileIds$ = toObservable(this.#ownerProfileIds);

  #ownerProfileId(doc: IEntity | ICompilation): string | undefined {
    const userId = this.currentOwner()?._id;
    const ownEntry = doc.access?.find(
      entry => entry._id === userId && entry.role === EntityAccessRole.owner,
    );
    return ownEntry?.profile?.profileId ?? doc.creator?.profile?.profileId;
  }

  filteredProfiles$ = combineLatest([
    this.searchControl.valueChanges.pipe(
      startWith(''),
      debounce(value => (typeof value === 'string' && value.trim() ? timer(300) : of(0))),
      distinctUntilChanged(),
      switchMap(value => {
        const query = typeof value === 'string' ? value.trim() : '';
        return from(this.#backend.searchProfiles(query, 'all')).pipe(
          map(results => ({ query, results })),
          catchError(err => {
            console.error('Failed searching profiles', err);
            return of({ query, results: [] as IPublicProfile[] });
          }),
        );
      }),
    ),
    this.#ownProfiles$,
    this.#ownerProfileIds$,
  ]).pipe(
    map(([{ query, results }, ownProfiles, ownerProfileIds]) => {
      const normalizedQuery = query.toLowerCase();
      const isSelectable = (profile: IPublicProfile) => !ownerProfileIds.has(profile._id);
      const otherProfiles = ownProfiles.filter(
        profile =>
          isSelectable(profile) &&
          (!normalizedQuery || (profile.displayName ?? '').toLowerCase().includes(normalizedQuery)),
      );
      const leadingIds = new Set(otherProfiles.map(profile => profile._id));
      return [
        ...otherProfiles,
        ...results.filter(profile => !leadingIds.has(profile._id) && isSelectable(profile)),
      ];
    }),
  );

  public async profileSelected(event: MatAutocompleteSelectedEvent) {
    const profile = event.option.value as IPublicProfile;
    this.targetProfile.set(profile);
    this.targetUserId.set(await this.#resolveTargetUserId(profile));
  }

  public profileImageUrl(profile: IPublicProfile): string {
    const imageUrl = profile.imageUrl;
    if (!imageUrl) return '/assets/kompakkt-logo-cube.svg';
    return imageUrl.startsWith('data:') ? imageUrl : getServerUrl(imageUrl);
  }

  public profileTypeLabel(profile: IPublicProfile): string {
    return profile.type === ProfileType.organization ? 'Organization' : 'User profile';
  }

  async #resolveTargetUserId(profile: IPublicProfile): Promise<string | undefined> {
    if (profile.type === ProfileType.organization && profile.ownerId) return profile.ownerId;
    const user = await this.#backend.getUserOfProfile(profile._id).catch(err => {
      console.error('Failed resolving user for profile', err);
      return undefined;
    });
    return user?._id;
  }

  public removeTarget() {
    this.targetProfile.set(undefined);
    this.targetUserId.set(undefined);
  }

  public async transferOwnership() {
    const data = this.data();
    const targetProfile = this.targetProfile();
    const targetUserId = this.targetUserId();

    if (!targetProfile || !targetUserId) return;

    const loginData = await this.#helper.verifyAuthentication(
      'Validate login before transferring ownership',
    );
    if (!loginData) return;

    try {
      const savePromises = data.map(doc =>
        this.#backend.transferOwnerShip({
          docId: doc._id,
          targetUserId,
          profileId: targetProfile._id,
          actingProfileId: this.#ownerProfileId(doc),
          collection: isEntity(doc) ? Collection.entity : Collection.compilation,
        }),
      );
      await Promise.all(savePromises);

      this.#dialogRef.close(data);
    } catch (error) {
      console.error('Owner could not be transferred: ', error);
      this.#snackbar.showMessage('Ownership could not be transferred');
    }
  }

  public cancel() {
    this.#dialogRef.close(false);
  }
}
