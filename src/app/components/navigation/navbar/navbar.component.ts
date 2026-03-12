import { AsyncPipe } from '@angular/common';
import { AfterViewInit, Component, computed, inject, input, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBar, MatProgressBarModule } from '@angular/material/progress-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CustomBrandingPlugin } from '@kompakkt/plugins/custom-branding';
import { IsCompilationPipe } from 'src/app/pipes/is-compilation.pipe';
import { IsEntityPipe } from 'src/app/pipes/is-entity.pipe';
import { TruncatePipe } from 'src/app/pipes/truncate.pipe';
import {
  AccountService,
  DialogHelperService,
  EventsService,
  ProgressBarService,
  SelectHistoryService,
} from 'src/app/services';
import { SidenavService } from 'src/app/services/sidenav.service';
import {
  Collection,
  ICompilation,
  IEntity,
  ProfileType,
  isCompilation,
  isEntity,
} from 'src/common';
import { IPublicProfile } from 'src/common/interfaces';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { SidenavListComponent } from '../sidenav-list/sidenav-list.component';
import { MatDividerModule } from '@angular/material/divider';
import { getServerUrl } from 'src/app/util/get-server-url';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  imports: [
    MatToolbarModule,
    MatDividerModule,
    RouterLink,
    RouterLinkActive,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    AsyncPipe,
    TranslatePipe,
    MatTooltipModule,
    MatMenuModule,
    IsEntityPipe,
    IsCompilationPipe,
    TruncatePipe,
  ],
})
export class NavbarComponent implements AfterViewInit {
  element = input<IEntity | ICompilation | undefined>();

  isEntity = computed(() => isEntity(this.element()));
  isCompilation = computed(() => isCompilation(this.element()));

  progressBar = viewChild.required(MatProgressBar);

  #customBrandingPlugin = inject<CustomBrandingPlugin>(CustomBrandingPlugin.providerToken, {
    optional: true,
  });
  customLogoAsset = computed(() => {
    const settings = this.#customBrandingPlugin?.settings();
    return settings?.base64Assets?.headerLogo;
  });

  allProfiles = toSignal(this.account.profiles$, { initialValue: [] });
  organizationalProfiles = toSignal(this.account.organizationProfiles$, { initialValue: [] });
  currentProfile = toSignal(this.account.currentProfile$, { initialValue: null });
  userProfile = toSignal(this.account.userProfile$, { initialValue: null });

  currentProfileImageUrl = computed(() => {
    const imageUrl = this.currentProfile()?.imageUrl;
    if (!imageUrl) return '/assets/kompakkt-logo-cube.svg';
    return imageUrl.startsWith('data:') ? imageUrl : getServerUrl(`${imageUrl}?t=${Date.now()}`);
  });

  constructor(
    public account: AccountService,
    private progress: ProgressBarService,
    private dialogHelper: DialogHelperService,
    public selectHistory: SelectHistoryService,
    private router: Router,
    private events: EventsService,
  ) {}

  ngAfterViewInit() {
    this.progress.setProgressBar(this.progressBar());
  }

  public navigate(element: IEntity | ICompilation) {
    return this.router.navigateByUrl(
      `/${isEntity(element) ? 'entity' : 'compilation'}/${element._id}`,
    );
  }

  public openEntityCreation(entity?: IEntity) {
    return this.dialogHelper.editEntity(entity);
  }

  public logout() {
    this.account.logout().then(() => this.router.navigate(['/']));
  }

  #sidenavService = inject(SidenavService);
  public async onToggleSidenav() {
    const result = await this.#sidenavService.openWithResult(SidenavListComponent);
    if (!result) return;
    console.log(result);
  }

  public openLoginDialog() {
    this.dialogHelper.openLoginDialog();
  }

  public openRegisterDialog() {
    this.dialogHelper.openRegisterDialog();
  }

  public editProfile(profile?: IPublicProfile) {
    this.dialogHelper.editProfile(profile ? profile : { type: ProfileType.organization });
  }
}
