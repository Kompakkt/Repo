import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';

import { AuthDialogComponent } from '~components';
import { ResetPasswordDialogComponent } from '~dialogs';

@Injectable({
  providedIn: 'root',
})
export class QueryActionService {
  private location = window.location;
  private url = new URL(this.location.href);

  constructor(private dialog: MatDialog) {}

  get search() {
    return this.url.searchParams;
  }

  public evaluateAction() {
    const action = this.search.get('action');
    if (!action) return;

    switch (action) {
      case 'login':
        return this.loginAction();
      case 'passwordreset':
        return this.passwordResetAction();
    }
  }

  private loginAction() {
    const username = this.search.get('username');
    const dialog = this.dialog.open(AuthDialogComponent, {
      data: { username },
      disableClose: true,
    });
    firstValueFrom(dialog.afterClosed()).then(() => {
      this.removeParams();
    });
  }

  private passwordResetAction() {
    const token = this.search.get('token');
    const dialog = this.dialog.open(ResetPasswordDialogComponent, {
      data: { token },
      disableClose: true,
    });
    firstValueFrom(dialog.afterClosed()).then(() => {
      this.removeParams();
      this.dialog.open(AuthDialogComponent, { disableClose: true });
    });
  }

  private removeParams() {
    const url = new URL(window.location.href);
    url.searchParams.delete('token');
    url.searchParams.delete('username');
    url.searchParams.delete('action');
    window.history.pushState(null, '', url.toString());
  }
}
