import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { EventsService } from './events.service';
import { AuthDialogComponent } from '../components/auth-dialog/auth-dialog.component';
import { RegisterDialogComponent } from '../dialogs/register-dialog/register-dialog.component';
import { AddCompilationWizardComponent } from '../components/wizards/add-compilation/add-compilation-wizard.component';

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

  public openCompilationWizard(compilation?) {
    return this.dialog.open(AddCompilationWizardComponent, {
      data: compilation ? compilation : undefined,
      disableClose: true,
    });
  }
}
