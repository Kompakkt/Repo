import { Component, computed, inject, model, resource, signal } from '@angular/core';
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
import { OutlinedInputComponent } from 'src/app/components/outlined-input/outlined-input.component';
import { AnimatedImageDirective } from 'src/app/directives/animated-image.directive';
import { NgxFluentPipe } from '@apappas1129/ngx-fluent';
import { BackendService } from 'src/app/services/backend.service';
import { getServerUrl } from 'src/app/util/get-server-url';
import {
  IPublicProfile,
  IStrippedUserData,
  ProfileMemberRole,
  ProfileType,
} from '@kompakkt/common';
import { form, FormField, maxLength, required, submit } from '@angular/forms/signals';
import { AccountService } from 'src/app/services/account.service';

type MemberRow = {
  userId: string;
  fullname?: string;
  username?: string;
  role: string;
};

@Component({
  selector: 'app-profile-page-edit',
  imports: [
    FormField,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatAutocompleteModule,
    MatOptionModule,
    MatSelectModule,
    MatIconModule,
    MatDividerModule,
    NgxFluentPipe,
    AnimatedImageDirective,
    OutlinedInputComponent,
  ],
  templateUrl: './profile-page-edit.component.html',
  styleUrl: './profile-page-edit.component.scss',
})
export class ProfilePageEditComponent {
  data = inject<Partial<IPublicProfile>>(MAT_DIALOG_DATA);
  dialogRef: MatDialogRef<ProfilePageEditComponent, IPublicProfile> = inject(MatDialogRef);
  backend = inject(BackendService);
  #account = inject(AccountService);

  isOrganization = signal(this.data?.type === ProfileType.organization);

  model = model({ displayName: '', location: '', imageUrl: '', description: '', website: '' });

  form = form(this.model, path => {
    required(path.displayName, { message: 'Display name is required' });
    maxLength(path.description, 500, {
      message: 'Description length cannot exceed 500 characters',
    });
  });

  imageUrl = computed(() => {
    const imageUrl = this.form().value().imageUrl;
    if (!imageUrl) return '/assets/kompakkt-logo-cube.svg';
    return imageUrl.startsWith('data:') ? imageUrl : getServerUrl(imageUrl);
  });

  profileId = this.data?._id;

  members = signal<MemberRow[]>([]);
  membersLoadFailed = signal(false);

  canManageMembers = computed(() => {
    const userId = this.#account.user()?._id;
    if (!userId) return false;
    if (this.data?.ownerId === userId) return true;
    return (
      this.members().find(member => member.userId === userId)?.role === ProfileMemberRole.owner
    );
  });

  roleOptions = [{ value: ProfileMemberRole.editor, label: 'Member' }] as const;

  searchModel = model('');
  searchForm = form(this.searchModel);

  #memberIds = computed(() => new Set(this.members().map(member => member.userId)));

  #allAccountsResource = resource({ loader: () => this.backend.getAccounts() });
  filteredAccounts = computed(() => {
    const query = this.searchForm().value().trim().toLowerCase();
    const accounts = this.#allAccountsResource.hasValue() ? this.#allAccountsResource.value() : [];
    return query.length >= 1
      ? accounts.filter(
          account =>
            !this.#memberIds().has(account._id) &&
            Object.values(account).join('').toLowerCase().includes(query),
        )
      : [];
  });

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
    this.searchForm().value.set('');
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

  async updateMemberRole(role: ProfileMemberRole, member: MemberRow) {
    if (!this.profileId) return;
    try {
      await this.backend.updateOrganizationMemberRole(this.profileId, member.userId, { role });
      await this.#refreshMembers();
    } catch (error) {
      console.error('Failed updating member role', error);
    }
  }

  async removeMember(member: MemberRow) {
    if (!this.profileId) return;
    try {
      await this.backend.removeOrganizationMember(this.profileId, member.userId);
      await this.#refreshMembers();
    } catch (error) {
      console.error('Failed removing member', error);
    }
  }

  async save() {
    let updatedProfile: IPublicProfile | undefined = undefined;
    const success = submit(this.form, async form => {
      const existing = this.data;
      const data = form().value();
      const payload = {
        ...existing,
        displayName: data.displayName,
        location: data.location,
        imageUrl: data.imageUrl,
        description: data.description,
        socials: {
          ...existing?.socials,
          website: data.website ?? '',
        },
        type: existing?.type ?? ProfileType.user,
      };

      const result = await this.backend
        .updateProfile(payload)
        .catch(() => ({ error: 'Failed updating profile' }));
      if ('error' in result) {
        return {
          kind: 'serverError',
          message: result.error,
          fieldTree: form,
        };
      }

      updatedProfile = result;
      return undefined;
    });
    if (!success) return;
    this.#account.updateTrigger$.next('profile');
    this.dialogRef.close(updatedProfile);
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
        this.form().value.update(form => ({ ...form, imageUrl: base64String }));
      };
      reader.readAsDataURL(file);
    }
  }
}
