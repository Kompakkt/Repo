import { AsyncPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { MatSelectModule } from '@angular/material/select';
import { catchError, combineLatestWith, from, map, of, startWith } from 'rxjs';
import { OutlinedInputComponent } from 'src/app/components/outlined-input/outlined-input.component';
import { AnimatedImageDirective } from 'src/app/directives/animated-image.directive';
import { TranslatePipe } from 'src/app/pipes';
import { AccountService } from 'src/app/services';
import { BackendService } from 'src/app/services/backend.service';
import { getServerUrl } from 'src/app/util/get-server-url';
import {
  IPublicProfile,
  IStrippedUserData,
  ProfileMemberRole,
  ProfileType,
} from '@kompakkt/common';

type MemberRow = {
  userId: string;
  fullname?: string;
  username?: string;
  role: string;
};

@Component({
  selector: 'app-profile-page-edit',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatAutocompleteModule,
    MatOptionModule,
    MatSelectModule,
    MatIconModule,
    MatDividerModule,
    AsyncPipe,
    TranslatePipe,
    AnimatedImageDirective,
    OutlinedInputComponent,
  ],
  templateUrl: './profile-page-edit.component.html',
  styleUrl: './profile-page-edit.component.scss',
})
export class ProfilePageEditComponent {
  #fb = inject(FormBuilder);
  data = inject<Partial<IPublicProfile>>(MAT_DIALOG_DATA);

  isOrganization = signal(this.data?.type === ProfileType.organization);

  form = this.#fb.nonNullable.group({
    displayName: [this.data?.displayName ?? '', Validators.required],
    location: [this.data?.location ?? ''],
    imageUrl: [this.data?.imageUrl ?? ''],
    description: [this.data?.description ?? '', Validators.maxLength(500)],
    website: [this.data?.socials?.website ?? ''],
  });

  dialogRef: MatDialogRef<ProfilePageEditComponent, IPublicProfile> = inject(MatDialogRef);
  backend = inject(BackendService);
  #account = inject(AccountService);

  formImageUrl = toSignal(
    this.form.controls.imageUrl.valueChanges.pipe(startWith(this.data?.imageUrl)),
  );

  imageUrl = computed(() => {
    const imageUrl = this.formImageUrl();
    if (!imageUrl) return '/assets/kompakkt-logo-cube.svg';
    return imageUrl.startsWith('data:') ? imageUrl : getServerUrl(imageUrl);
  });

  profileId = this.data?._id;

  members = signal<MemberRow[]>([]);
  membersLoadFailed = signal(false);

  #currentUser = toSignal(this.#account.user$, { initialValue: undefined });

  canManageMembers = computed(() => {
    const userId = this.#currentUser()?._id;
    if (!userId) return false;
    if (this.data?.ownerId === userId) return true;
    return this.members().find(member => member.userId === userId)?.role === ProfileMemberRole.owner;
  });

  roleOptions = [
    { value: ProfileMemberRole.editor, label: 'Member' },
  ] as const;

  searchControl = new FormControl('', { nonNullable: true });

  #memberIds = computed(() => new Set(this.members().map(member => member.userId)));

  allAccounts$ = from(this.backend.getAccounts()).pipe(
    catchError(error => {
      console.error('Failed fetching accounts', error);
      return of<IStrippedUserData[]>([]);
    }),
  );

  filteredAccounts$ = this.allAccounts$.pipe(
    combineLatestWith(
      this.searchControl.valueChanges.pipe(
        startWith(''),
        map(value => value.toLowerCase().trim()),
      ),
    ),
    map(([accounts, search]) =>
      search.length >= 1
        ? accounts.filter(
            account =>
              !this.#memberIds().has(account._id) &&
              Object.values(account).join('').toLowerCase().includes(search),
          )
        : [],
    ),
  );

  isBootstrapOwner = (userId: string): boolean => this.data?.ownerId === userId;

  constructor() {
    if (this.isOrganization()) {
      void this.#refreshMembers();
    }
  }

  async #refreshMembers() {
    if (!this.profileId) return;
    try {
      const [result, accounts] = await Promise.all([
        this.backend.getOrganizationMembers(this.profileId),
        this.backend.getAccounts().catch(() => [] as IStrippedUserData[]),
      ]);
      const accountById = new Map(accounts.map(account => [account._id, account] as const));
      const owner = result.owner;
      const rows: MemberRow[] = [
        {
          userId: owner._id,
          fullname: owner.fullname,
          username: owner.username,
          role: ProfileMemberRole.owner,
        },
        ...(result.members ?? [])
          .filter(member => member.userId !== owner._id)
          .map(member => ({
            userId: member.userId,
            fullname: accountById.get(member.userId)?.fullname,
            username: accountById.get(member.userId)?.username,
            role: member.role,
          })),
      ];
      this.members.set(rows);
      this.membersLoadFailed.set(false);
    } catch (error) {
      console.error('Failed loading organization members', error);
      this.membersLoadFailed.set(true);
    }
  }

  public userSelected(event: MatAutocompleteSelectedEvent) {
    const account = event.option.value as IStrippedUserData;
    this.searchControl.setValue('');
    void this.#addMember(account);
  }

  async #addMember(account: IStrippedUserData) {
    if (!this.profileId) return;
    try {
      await this.backend.addOrganizationMember(this.profileId, {
        userId: account._id,
        role: ProfileMemberRole.editor,
      });
      await this.#refreshMembers();
    } catch (error) {
      console.error('Failed adding member', error);
    }
  }

  public async updateMemberRole(role: ProfileMemberRole, member: MemberRow) {
    if (!this.profileId) return;
    try {
      await this.backend.updateOrganizationMemberRole(this.profileId, member.userId, { role });
      await this.#refreshMembers();
    } catch (error) {
      console.error('Failed updating member role', error);
    }
  }

  public async removeMember(member: MemberRow) {
    if (!this.profileId) return;
    try {
      await this.backend.removeOrganizationMember(this.profileId, member.userId);
      await this.#refreshMembers();
    } catch (error) {
      console.error('Failed removing member', error);
    }
  }

  async save() {
    if (this.form.valid) {
      const formValue = this.form.value;
      const payload = {
        ...this.data,
        displayName: formValue.displayName,
        location: formValue.location,
        imageUrl: formValue.imageUrl,
        description: formValue.description,
        socials: {
          ...this.data?.socials,
          website: formValue.website ?? '',
        },
        type: this.data?.type ?? ProfileType.user,
      };

      const updateProfile = await this.backend.updateProfile(payload);
      this.#account.updateTrigger$.next('profile');
      this.dialogRef.close(updateProfile);
    }
  }

  close(): void {
    this.dialogRef.close();
  }

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result as string;
        this.form.patchValue({ imageUrl: base64String });
      };
      reader.readAsDataURL(file);
    }
  }
}
