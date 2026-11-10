import { Component, computed, inject, input, ChangeDetectionStrategy } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { CustomBrandingPlugin } from '@kompakkt/plugins/custom-branding';
import { IsCompilationPipe } from 'src/app/pipes/is-compilation.pipe';
import { IsEntityPipe } from 'src/app/pipes/is-entity.pipe';
import { TruncatePipe } from 'src/app/pipes/truncate.pipe';
import { SidenavService } from 'src/app/services/sidenav.service';
import {
  ICompilation,
  IEntity,
  ProfileMemberRole,
  ProfileType,
  isCompilation,
  isEntity,
  IPublicProfile,
} from '@kompakkt/common';
import { NgxFluentPipe } from '@apappas1129/ngx-fluent';
import { SidenavListComponent } from '../sidenav-list/sidenav-list.component';
import { MatDividerModule } from '@angular/material/divider';
import { getServerUrl } from 'src/app/util/get-server-url';
import { AccountService } from 'src/app/services/account.service';
import { DialogHelperService } from 'src/app/services/dialog-helper.service';
import { SelectHistoryService } from 'src/app/services/select-history.service';

const constructProfileImageUrl = (
  profile: IPublicProfile | null | undefined,
): string | undefined => {
  const imageUrl = profile?.imageUrl;
  if (!imageUrl) return undefined;
  return imageUrl.startsWith('data:') ? imageUrl : getServerUrl(imageUrl);
};

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    MatToolbarModule,
    MatDividerModule,
    RouterLink,
    RouterLinkActive,
    MatButtonModule,
    MatIconModule,
    NgxFluentPipe,
    MatTooltipModule,
    MatMenuModule,
    IsEntityPipe,
    IsCompilationPipe,
    TruncatePipe,
  ],
})
export class NavbarComponent {
  account = inject(AccountService);
  #dialogHelper = inject(DialogHelperService);
  selectHistory = inject(SelectHistoryService);
  #router = inject(Router);

  element = input<IEntity | ICompilation | undefined>();

  isEntity = computed(() => isEntity(this.element()));
  isCompilation = computed(() => isCompilation(this.element()));

  #customBrandingPlugin = inject<CustomBrandingPlugin>(CustomBrandingPlugin.providerToken, {
    optional: true,
  });
  customLogoAsset = computed(() => {
    const settings = this.#customBrandingPlugin?.settings();
    return settings?.base64Assets?.headerLogo;
  });

  otherProfiles = computed(() =>
    this.account
      .profiles()
      .filter(profile => profile._id !== this.account.currentProfile()?._id)
      .map(profile => ({
        ...profile,
        imageUrl: constructProfileImageUrl(profile),
      })),
  );

  canCreateInCurrentProfile = computed(() => {
    const profile = this.account.currentProfile();
    if (!profile) return false;
    const userId = this.account.user()?._id;
    if (!userId) return false;
    if (profile._id === this.account.userProfile()?._id || profile.ownerId === userId) return true;
    const membership = profile.members?.find(member => member.userId === userId);
    return !!membership && membership.role !== ProfileMemberRole.viewer;
  });

  currentProfileImageUrl = computed(
    () =>
      constructProfileImageUrl(this.account.currentProfile()) ?? '/assets/kompakkt-logo-cube.svg',
  );

  public navigate(element: IEntity | ICompilation) {
    return this.#router.navigateByUrl(
      `/${isEntity(element) ? 'entity' : 'compilation'}/${element._id}`,
    );
  }

  public openEntityCreation(entity?: IEntity) {
    return this.#dialogHelper.editEntity(entity);
  }

  public logout() {
    this.account.logout().then(() => this.#router.navigate(['/']));
  }

  #sidenavService = inject(SidenavService);
  async onToggleSidenav() {
    await this.#sidenavService.openWithResult(SidenavListComponent);
  }

  public openLoginDialog() {
    this.#dialogHelper.openLoginDialog();
  }

  public openRegisterDialog() {
    this.#dialogHelper.openRegisterDialog();
  }

  public editProfile(profile?: IPublicProfile) {
    const isCreate = !profile;
    firstValueFrom(
      this.#dialogHelper
        .editProfile(profile ? profile : { type: ProfileType.organization })
        .afterClosed(),
    ).then(createdProfile => {
      if (!isCreate || !createdProfile) return;
      this.account.switchToProfile(createdProfile);
      this.#router.navigateByUrl(`/profile/${createdProfile.type}/${createdProfile._id}`);
    });
  }
}
