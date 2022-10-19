import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';

import { AccountService, BackendService } from 'src/app/services';

@Component({
  selector: 'app-register-dialog',
  templateUrl: './register-dialog.component.html',
  styleUrls: ['./register-dialog.component.scss'],
})
export class RegisterDialogComponent {
  public error = '';

  public form = new UntypedFormGroup({
    prename: new UntypedFormControl('', Validators.required),
    surname: new UntypedFormControl('', Validators.required),
    username: new UntypedFormControl('', Validators.required),
    mail: new UntypedFormControl('', [Validators.required, Validators.email]),
    password: new UntypedFormControl('', Validators.required),
    passwordRepeat: new UntypedFormControl('', Validators.required),
  });

  public waitingForResponse = false;

  constructor(
    private backend: BackendService,
    public dialogRef: MatDialogRef<RegisterDialogComponent>,
    private account: AccountService,
  ) {}

  public async trySubmit() {
    this.error = '';
    const { username, password, prename, surname, passwordRepeat } = this.form.value;

    if (password !== passwordRepeat) {
      this.error = 'Passwords do not match';
      return;
    }

    this.waitingForResponse = true;
    this.dialogRef.disableClose = true;

    const registerSuccess = await this.backend
      .registerAccount({ ...this.form.value, fullname: `${prename} ${surname}` })
      .catch((e: HttpErrorResponse) => {
        console.log('Error', e);
        this.error = e.error;
        return false;
      });
    console.log('Response', registerSuccess);
    if (!registerSuccess) {
      this.waitingForResponse = false;
      this.dialogRef.disableClose = false;
      return;
    }

    const userdata = await this.account.loginOrFetch({ username, password });

    this.dialogRef.disableClose = false;
    this.waitingForResponse = false;
    if (!userdata) return;

    this.dialogRef.close({ username, password });
  }
}
