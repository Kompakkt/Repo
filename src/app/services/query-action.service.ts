import { inject, Service } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';

import { ResetPasswordDialogComponent } from '../dialogs/reset-password-dialog/reset-password-dialog.component';
import { AuthDialogComponent } from '../dialogs/auth-dialog/auth-dialog.component';

@Service()
export class QueryActionService {
  #dialog = inject(MatDialog);

  #location = window.location;
  #url = new URL(this.#location.href);

  get search() {
    return this.#url.searchParams;
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
    const dialog = this.#dialog.open(AuthDialogComponent, {
      data: { username },
      disableClose: true,
    });
    void firstValueFrom(dialog.afterClosed()).then(() => {
      this.removeParams();
    });
  }

  private passwordResetAction() {
    const token = this.search.get('token');
    const dialog = this.#dialog.open(ResetPasswordDialogComponent, {
      data: { token },
      disableClose: true,
    });
    void firstValueFrom(dialog.afterClosed()).then(() => {
      this.removeParams();
      this.#dialog.open(AuthDialogComponent, { disableClose: true });
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
