import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

import { AccountService } from '../../services/account.service';
import { BackendService } from '../../services/backend.service';

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
      .then(registerResult => {
        console.log(registerResult);
        // TODO: handle success
        this.account.attemptLogin(data.username, data.password);
        this.dialogRef.close('success');

        this.waitingForResponse = false;
      })
      .then(loginResult => {})
      .catch(e => {
        console.error(e);
        this.error = true;
        this.errorMessages = [e.message];

        this.waitingForResponse = false;
      });
  }
}
