import { Component, signal } from '@angular/core';
import { MatDialogRef, MatDialog } from '@angular/material/dialog';

import { AuthDialogComponent } from 'src/app/components/auth-dialog/auth-dialog.component';

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

import { MatButtonModule } from '@angular/material/button';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormField, MatFormFieldModule } from '@angular/material/form-field';
import { OutlinedInputComponent } from 'src/app/components/outlined-input/outlined-input.component';
import { map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { KeyValuePipe } from '@angular/common';

@Component({
  selector: 'app-register-dialog',
  templateUrl: './register-dialog.component.html',
  styleUrls: ['./register-dialog.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    TranslatePipe,
    MatIconModule,
    OutlinedInputComponent,
  ],
})
export class RegisterDialogComponent {
  public form = new FormGroup({
    prename: new FormControl('', { validators: Validators.required, nonNullable: true }),
    surname: new FormControl('', { validators: Validators.required, nonNullable: true }),
    username: new FormControl('', { validators: Validators.required, nonNullable: true }),
    mail: new FormControl('', {
      validators: [Validators.required, Validators.email],
      nonNullable: true,
    }),
    password: new FormControl('', { validators: Validators.required, nonNullable: true }),
    passwordRepeat: new FormControl('', {
      validators: [
        Validators.required,
        control => {
          const password = control.parent?.get('password');
          if (!password?.value) return null;
          if (!password?.touched) return null;
          if (!control.touched) return null;
          return control.value === password.value ? null : { passwordMismatch: true };
        },
      ],
      nonNullable: true,
    }),
  });

  public waitingForResponse = false;

  constructor(
    private backend: BackendService,
    public dialogRef: MatDialogRef<RegisterDialogComponent>,
    private account: AccountService,
    private dialog: MatDialog,
  ) {}

  public async trySubmit() {
    const { username, password, prename, surname, passwordRepeat } = this.form.value;
    if (!username || !password) {
      alert('Missing username or password');
      return;
    }

    if (password !== passwordRepeat) {
      alert('Passwords do not match');
      return;
    }

    this.waitingForResponse = true;
    this.dialogRef.disableClose = true;

    const registerSuccess = await this.backend
      .registerAccount({ ...this.form.value, fullname: `${prename} ${surname}` })
      .catch((e: HttpErrorResponse) => {
        console.log('Error', e);
        alert(e.error);
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

  public openAuthDialog() {
    this.dialog.open(AuthDialogComponent);
  }
}
