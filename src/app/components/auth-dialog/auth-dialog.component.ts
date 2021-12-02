import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { AccountService } from 'src/app/services';

@Component({
  selector: 'app-auth-dialog',
  templateUrl: './auth-dialog.component.html',
  styleUrls: ['./auth-dialog.component.scss'],
})
export class AuthDialogComponent {
  public waitingForResponse = false;
  public loginFailed = false;

  public data = {
    username: '',
    password: '',
  };

  constructor(
    public dialogRef: MatDialogRef<AuthDialogComponent>,
    public account: AccountService,
    @Inject(MAT_DIALOG_DATA) public concern: string,
  ) {}

  public async clickedLogin() {
    const { username, password } = this.data;

    this.waitingForResponse = true;
    this.dialogRef.disableClose = true;

    const success = await this.account.attemptLogin(username, password);

    this.dialogRef.disableClose = false;
    this.waitingForResponse = false;

    this.loginFailed = !success;
    if (!success) return;

    this.dialogRef.close({ username, password });
  }
}
