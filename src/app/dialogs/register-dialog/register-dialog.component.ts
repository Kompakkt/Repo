import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import {
  FormControl,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';

import { AccountService, BackendService } from 'src/app/services';
import { TranslateService } from '../../services/translate.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

import { MatButton } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormField } from '@angular/material/form-field';

@Component({
  selector: 'app-register-dialog',
  templateUrl: './register-dialog.component.html',
  styleUrls: ['./register-dialog.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatFormField,
    MatInputModule,
    MatButton,
    TranslatePipe,
  ],
})
export class RegisterDialogComponent {
  public error = '';

  public form = new FormGroup({
    prename: new FormControl('', Validators.required),
    surname: new FormControl('', Validators.required),
    username: new FormControl('', Validators.required),
    mail: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', Validators.required),
    passwordRepeat: new FormControl('', Validators.required),
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
    if (!username || !password) {
      this.error = 'Missing username or password';
      return;
    }

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
