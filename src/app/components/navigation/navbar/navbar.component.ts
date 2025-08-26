import { AsyncPipe } from '@angular/common';
import {
  AfterViewInit,
  Component,
  EventEmitter,
  Output,
  computed,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CustomBrandingPlugin } from '@kompakkt/plugins/custom-branding';
import { ConfirmationDialogComponent, UploadApplicationDialogComponent } from 'src/app/dialogs';
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
import { AddEntityWizardComponent } from 'src/app/wizards';
import {
  Collection,
  ICompilation,
  IEntity,
  ProfileType,
  UserRank,
  isCompilation,
  isEntity,
} from 'src/common';
import { IPublicProfile, IUserDataWithoutData } from 'src/common/interfaces';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { SidenavService } from 'src/app/services/sidenav.service';
import { SidenavListComponent } from '../sidenav-list/sidenav-list.component';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  imports: [
    MatToolbarModule,
    RouterLink,
    RouterLinkActive,
    MatButtonModule,
    MatIconModule,
    MatProgressBar,
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
  public userData: IUserDataWithoutData | undefined;

  progressBar = viewChild.required(MatProgressBar);

  #customBrandingPlugin = inject<CustomBrandingPlugin>(CustomBrandingPlugin.providerToken, {
    optional: true,
  });
  customLogoAsset = computed(() => {
    const settings = this.#customBrandingPlugin?.settings();
    return settings?.base64Assets?.headerLogo;
  });

  institutionalProfiles = toSignal(this.account.institutionProfiles$, { initialValue: [] });

  constructor(
    private account: AccountService,
    private progress: ProgressBarService,
    private dialog: MatDialog,
    private dialogHelper: DialogHelperService,
    public selectHistory: SelectHistoryService,
    private router: Router,
    private events: EventsService,
  ) {
    this.account.userData$.subscribe(newData => {
      if (!newData) return;
      this.userData = newData;
    });
  }

  get isAuthenticated$() {
    return this.account.isAuthenticated$;
  }

  get isAdmin$() {
    return this.account.isAdmin$;
  }

  ngAfterViewInit() {
    this.progress.setProgressBar(this.progressBar());
  }

  public navigate(element: IEntity | ICompilation) {
    return this.router.navigateByUrl(
      `/${isEntity(element) ? 'entity' : 'compilation'}/${element._id}`,
    );
  }

  get isUploader() {
    return this.userData?.role === UserRank.admin || this.userData?.role === UserRank.uploader;
  }

  get hasRequestedUpload() {
    if (!this.userData) return false;
    return this.userData?.role === UserRank.uploadrequested;
  }

  public async openCompilationCreation(compilation?: ICompilation) {
    const dialogRef = this.dialogHelper.openCompilationWizard(compilation);
    dialogRef
      .afterClosed()
      .toPromise()
      .then(result => {
        this.account.updateTrigger$.next(Collection.compilation);
        this.events.updateSearchEvent();
      });
  }

  public async openEntityCreation(entity?: IEntity) {
    const dialogRef = this.dialog.open(AddEntityWizardComponent, {
      data: entity ? entity : undefined,
      disableClose: true,
    });

    dialogRef
      .afterClosed()
      .toPromise()
      .then(result => {
        this.account.updateTrigger$.next(Collection.entity);
        this.events.updateSearchEvent();
      });
  }

  public openUploadApplication() {
    if (!this.userData) {
      alert('Not logged in');
      return;
    }
    const dialogRef = this.dialog.open(UploadApplicationDialogComponent, {
      data: this.userData,
      disableClose: true,
    });

    dialogRef.backdropClick().subscribe(async () => {
      const confirm = this.dialog.open(ConfirmationDialogComponent, {
        data: 'Do you want to cancel your application?',
      });
      await confirm
        .afterClosed()
        .toPromise()
        .then(shouldClose => {
          if (shouldClose) {
            dialogRef.close();
          }
        });
    });
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
    this.dialogHelper.editProfile(profile ? profile : { type: ProfileType.institution });
  }
}
