import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { EventsService } from './events.service';
import { ICompilation, IEntity } from '@kompakkt/shared';
import { AuthDialogComponent } from '../components/auth-dialog/auth-dialog.component';
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

  public openCompilationWizard(data?: ICompilation | string) {
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
}
