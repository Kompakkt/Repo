import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { EventsService } from './events.service';
import { ICompilation, IEntity } from 'src/common';
import { AuthDialogComponent } from '../components/auth-dialog/auth-dialog.component';
import { ConfirmationDialogComponent } from '../dialogs/confirmation-dialog/confirmation-dialog.component';
import { RegisterDialogComponent } from '../dialogs/register-dialog/register-dialog.component';
import { AddCompilationWizardComponent } from '../wizards/add-compilation/add-compilation-wizard.component';
import { AddEntityWizardComponent } from '../wizards/add-entity/add-entity-wizard.component';
import { EditEntityDialogComponent } from '../dialogs/edit-entity-dialog/edit-entity-dialog.component';
import { EntitySettingsDialogComponent } from '../dialogs/entity-settings-dialog/entity-settings-dialog.component';
import { PasswordProtectedDialogComponent } from '../dialogs/password-protected-dialog/password-protected-dialog.component';

@Injectable({
  providedIn: 'root',
})
export class DialogHelperService {
  constructor(private dialog: MatDialog, private events: EventsService) {}

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

  public openCompilationWizard(data?: ICompilation | IEntity | string) {
    return this.dialog.open(AddCompilationWizardComponent, {
      data,
      disableClose: true,
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

  public editVisibility(element: IEntity | undefined) {
    if (!element) return;
    const dialogRef = this.dialog.open(EntitySettingsDialogComponent, {
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
    const loginDialog = this.dialog.open<
      AuthDialogComponent,
      string,
      { username: string; password: string }
    >(AuthDialogComponent, {
      data: text,
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
