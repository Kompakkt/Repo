import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { EventsService } from './events.service';
import { ICompilation, IEntity } from '../interfaces';
import { AuthDialogComponent } from '../components/auth-dialog/auth-dialog.component';
import { RegisterDialogComponent } from '../dialogs/register-dialog/register-dialog.component';
import { AddCompilationWizardComponent } from '../wizards/add-compilation/add-compilation-wizard.component';
import { AddEntityWizardComponent } from '../wizards/add-entity/add-entity-wizard.component';
import { ExploreCompilationDialogComponent } from '../dialogs/explore-compilation-dialog/explore-compilation-dialog.component';
import { EditEntityDialogComponent } from '../dialogs/edit-entity-dialog/edit-entity-dialog.component';
import { EntitySettingsDialogComponent } from '../dialogs/entity-settings-dialog/entity-settings-dialog.component';

@Injectable({
  providedIn: 'root',
})
export class DialogHelperService {
  constructor(private dialog: MatDialog, private events: EventsService) {}

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

  public openCompilationWizard(compilation?: ICompilation) {
    return this.dialog.open(AddCompilationWizardComponent, {
      data: compilation ? compilation : undefined,
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
      data: element._id,
      disableClose: true,
      id: 'edit-entity-dialog',
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
