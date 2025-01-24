import { Component, EventEmitter, AfterViewInit, Input, Output, ViewChild } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatTooltip } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import {
  AccountService,
  ProgressBarService,
  DialogHelperService,
  SelectHistoryService,
  EventsService,
} from 'src/app/services';
import { AddEntityWizardComponent } from 'src/app/wizards';
import { isEntity, isCompilation, IEntity, ICompilation, IUserData, UserRank } from 'src/common';
//import { TranslateService } from '../../../services/translate.service';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { MatIcon } from '@angular/material/icon';
import { MatButton, MatIconButton } from '@angular/material/button';
import { AsyncPipe } from '@angular/common';
import { MatToolbar } from '@angular/material/toolbar';
import { ConfirmationDialogComponent, UploadApplicationDialogComponent } from 'src/app/dialogs';

@Component({
    selector: 'app-navbar',
    templateUrl: './navbar.component.html',
    styleUrls: ['./navbar.component.scss'],
    imports: [
        MatToolbar,
        RouterLink,
        RouterLinkActive,
        MatButton,
        MatIconButton,
        MatIcon,
        MatProgressBar,
        AsyncPipe,
        TranslatePipe,
        MatTooltip,
        MatMenu,
        MatMenuItem,
        MatMenuTrigger,
    ]
})
export class NavbarComponent implements AfterViewInit {
  @Output() public sidenavToggle = new EventEmitter();
  @Input() element: IEntity | ICompilation | undefined;

  public isEntity = isEntity;
  public isCompilation = isCompilation;
  public userData: IUserData | undefined;

  @ViewChild('progressBar')
  private progressBar: undefined | MatProgressBar;

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
    if (this.progressBar) {
      this.progress.setProgressBar(this.progressBar);
    }
  }

  public navigate(element: IEntity | ICompilation) {
    // Parent will load and fetch relevant data
    this.element = undefined;

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
        this.events.updateSearchEvent();
        if (result && this.userData && this.userData.data.compilation) {
          if (compilation) {
            const index = (this.userData.data.compilation as ICompilation[]).findIndex(
              comp => comp._id === result._id,
            );
            if (index === -1) return;
            this.userData.data.compilation.splice(index, 1, result as ICompilation);
          } else {
            (this.userData.data.compilation as ICompilation[]).push(result as ICompilation);
          }
        }
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
        this.events.updateSearchEvent();
        if (result && this.userData && this.userData.data.entity) {
          const index = (this.userData.data.entity as IEntity[]).findIndex(
            _en => result._id === _en._id,
          );
          if (index === -1) return;
          this.userData.data.entity.splice(index, 1, result as IEntity);
          // this.updateFilter();
        }
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

  public onToggleSidenav() {
    this.sidenavToggle.emit();
  }

  public openLoginDialog() {
    this.dialogHelper.openLoginDialog();
  }

  public openRegisterDialog() {
    this.dialogHelper.openRegisterDialog();
  }
}
