import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { EventsService } from './events.service';
import { AuthDialogComponent } from '../components/auth-dialog/auth-dialog.component';
import { RegisterDialogComponent } from '../dialogs/register-dialog/register-dialog.component';

@Injectable({
  providedIn: 'root',
})
export class DialogHelperService {
  constructor(private dialog: MatDialog, private events: EventsService) {}

  public openLoginDialog() {
    this.dialog
      .open(AuthDialogComponent)
      .afterClosed()
      .toPromise()
      .then(() => this.events.updateSearchEvent());
  }

  public openRegisterDialog() {
    this.dialog.open(RegisterDialogComponent);
  }
}
