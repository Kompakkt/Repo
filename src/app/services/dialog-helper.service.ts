import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { firstValueFrom, take } from 'rxjs';
import { AuthDialogComponent } from 'src/app/components';
import {
  ConfirmationDialogComponent,
  EditEntityDialogComponent,
  GroupMemberDialogComponent,
  PasswordProtectedDialogComponent,
  RegisterDialogComponent,
  VisibilityAndAccessDialogComponent,
} from 'src/app/dialogs';
import { ProfilePageEditComponent } from 'src/app/dialogs/profile-page-edit/profile-page-edit.component';
import {
  AddCompilationWizardComponent,
  AddEntityWizardComponent,
  AddGroupWizardComponent,
} from 'src/app/wizards';
import { ICompilation, IEntity } from 'src/common';
import { IGroup, IPublicProfile } from 'src/common/interfaces';
import { AuthDialogData } from '../components/auth-dialog/auth-dialog.component';
import { EntityDownloadDialogComponent } from '../dialogs/entity-download-dialog/entity-download-dialog.component';
import {
  ViewerDialogComponent,
  ViewerDialogData,
} from '../dialogs/viewer-dialog/viewer-dialog.component';
import { AccountService, EventsService } from './';
import { IDownloadOptions } from './backend.service';

@Injectable({
  providedIn: 'root',
})
export class DialogHelperService {
  constructor(
    private account: AccountService,
    private dialog: MatDialog,
    private events: EventsService,
  ) {}

  public openPasswordProtectedDialog() {
    return this.dialog.open(PasswordProtectedDialogComponent, {
      disableClose: true,
    });
  }

  public openLoginDialog() {
    const dialogRef = this.dialog.open(AuthDialogComponent);

    dialogRef
      .afterClosed()
      .toPromise()
      .then(() => this.events.updateSearchEvent());

    return dialogRef;
  }

  public openRegisterDialog() {
    return this.dialog.open(RegisterDialogComponent);
  }

  public openCompilationWizard(data?: ICompilation | IEntity | IEntity[] | string) {
    return this.dialog.open(AddCompilationWizardComponent, {
      data,
      disableClose: true,
    });
  }

  public openEntityWizard() {
    return this.dialog.open(AddEntityWizardComponent, {
      disableClose: true,
    });
  }

  public openGroupWizard() {
    return this.dialog.open(AddGroupWizardComponent, {
      disableClose: true,
    });
  }

  public openGroupMemberDialog(group: IGroup) {
    return this.dialog.open(GroupMemberDialogComponent, {
      data: group,
    });
  }

  public openViewerDialog(data: ViewerDialogData) {
    return this.dialog.open<ViewerDialogComponent, ViewerDialogData>(ViewerDialogComponent, {
      data,
      id: 'viewer-dialog',
    });
  }

  public editCompilation(element: ICompilation | undefined) {
    if (!element) return;
    const dialogRef = this.dialog.open(AddCompilationWizardComponent, {
      data: element,
      disableClose: true,
    });
    dialogRef
      .afterClosed()
      .toPromise()
      .then(_ => {
        // TODO: Success toast
      });
    return dialogRef;
  }

  public editSettingsInViewer(element: IEntity | undefined) {
    if (!element) return;
    return this.dialog.open(EditEntityDialogComponent, {
      data: element,
      id: 'explore-entity-dialog',
      disableClose: true,
    });
  }

  public editMetadata(element: IEntity | undefined) {
    if (!element) return;
    const dialogRef = this.dialog.open(AddEntityWizardComponent, {
      data: element,
      disableClose: true,
    });
    dialogRef
      .afterClosed()
      .toPromise()
      .then(_ => {
        // TODO: Success toast
      });

    return dialogRef;
  }

  public editVisibilityAndAccess(element: IEntity | undefined) {
    if (!element) return;
    const dialogRef = this.dialog.open(VisibilityAndAccessDialogComponent, {
      data: element,
      disableClose: true,
    });
    dialogRef
      .afterClosed()
      .toPromise()
      .then(_ => {
        // TODO: Success toast
      });

    return dialogRef;
  }

  public editProfile(profile?: Partial<IPublicProfile>) {
    const ref = this.dialog.open<
      ProfilePageEditComponent,
      Partial<IPublicProfile> | undefined,
      IPublicProfile
    >(ProfilePageEditComponent, {
      width: '800px',
      data: profile,
    });

    ref
      .afterClosed()
      .pipe(take(1))
      .subscribe(updatedProfile => {
        if (!updatedProfile) return;
        this.account.updateTrigger$.next('profile');
      });

    return ref;
  }

  public async openEntityDownloadDialog(entity: IEntity, downloadOptions: IDownloadOptions) {
    const dialogRef = this.dialog.open(EntityDownloadDialogComponent, {
      data: {
        entity,
        downloadOptions,
      },
    });

    const promise = firstValueFrom(dialogRef.afterClosed());
  }

  public async confirm(text: string) {
    const confirmDialog = this.dialog.open(ConfirmationDialogComponent, {
      data: text,
    });
    return !!(await confirmDialog
      .afterClosed()
      .toPromise()
      .then(_r => _r));
  }

  public async verifyAuthentication(text: string) {
    const user = await this.account.getUserDataSnapshot();
    const loginDialog = this.dialog.open<
      AuthDialogComponent,
      AuthDialogData,
      { username: string; password: string }
    >(AuthDialogComponent, {
      data: { concern: text, username: user?.username },
      disableClose: true,
    });
    return await loginDialog
      .afterClosed()
      .toPromise()
      .then(_r => _r);
  }

  public async confirmWithAuth(confirmText: string, authText: string) {
    // Get confirmation
    const confirmed = await this.confirm(confirmText);
    if (!confirmed) return undefined;

    // Get and cache login data
    const loginData = await this.verifyAuthentication(authText);
    return loginData;
  }
}
