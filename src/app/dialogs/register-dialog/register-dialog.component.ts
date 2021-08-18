import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

import { AccountService, BackendService } from 'src/app/services';

@Component({
  selector: 'app-register-dialog',
  templateUrl: './register-dialog.component.html',
  styleUrls: ['./register-dialog.component.scss'],
})
export class RegisterDialogComponent {
  public error = false;
  public errorMessages: string[] = [];

  public prename = '';
  public surname = '';
  public username = '';
  public mail = '';
  public password = '';
  public passwordRepeat = '';

  public waitingForResponse = false;

  constructor(
    private backend: BackendService,
    public dialogRef: MatDialogRef<RegisterDialogComponent>,
    private account: AccountService,
  ) {}

  public isError() {
    const errorList: string[] = [];
    if (this.prename === '') {
      errorList.push('Enter your prename');
    }
    if (this.surname === '') {
      errorList.push('Enter your surname');
    }
    if (this.username === '') {
      errorList.push('Enter your username');
    }
    if (this.mail === '') {
      errorList.push('Enter your mail address');
    }
    if (this.password === '') {
      errorList.push('Enter a password');
    }
    if (this.password !== this.passwordRepeat) {
      errorList.push('Passwords do not match');
    }
    if (errorList.length > 0) {
      this.errorMessages = errorList;
      this.error = true;
    } else {
      this.error = false;
    }
    return this.error;
  }

  public clickedRegister() {
    this.isError();
    if (this.error) {
      return;
    }
    this.waitingForResponse = true;
    const data = {
      username: this.username,
      password: this.password,
      prename: this.prename,
      surname: this.surname,
      mail: this.mail,
      fullname: `${this.prename} ${this.surname}`,
    };

    this.backend
      .registerAccount(data)
      .catch(e => {
        console.warn('registerResponse', e);
        // TODO: Find out why success status code 201 is interpreted as an error
        if (e.status === 201) return true; // Success case

        // Fail case
        console.error(e);
        this.error = true;
        this.errorMessages = [e.message];

        this.waitingForResponse = false;
      })
      .then(() => {
        return this.account.attemptLogin(data.username, data.password);
      })
      .then(() => {
        this.dialogRef.close('success');
        this.waitingForResponse = false;
      });
  }
}
