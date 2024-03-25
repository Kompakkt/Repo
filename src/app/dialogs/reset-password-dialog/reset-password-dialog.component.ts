import { HttpErrorResponse } from '@angular/common/http';
import { Component, Inject, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { MatButton } from '@angular/material/button';
import { BackendService, SnackbarService } from 'src/app/services';
import { TranslatePipe } from '../../pipes/translate.pipe';

import { MatFormField } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';

@Component({
  selector: 'app-reset-password-dialog',
  templateUrl: './reset-password-dialog.component.html',
  styleUrls: ['./reset-password-dialog.component.scss'],
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, MatFormField, MatInput, MatButton, TranslatePipe],
})
export class ResetPasswordDialogComponent implements OnInit {
  public form = new FormGroup(
    {
      username: new FormControl('', Validators.required),
      password: new FormControl('', Validators.required),
      passwordRepeat: new FormControl('', Validators.required),
    },
    control => {
      const password = control.get('password');
      const passwordRepeat = control.get('passwordRepeat');

      if (!password?.touched && !passwordRepeat?.touched) return null;

      if (password?.value !== passwordRepeat?.value) return { not_equal: 'Passwords do not match' };

      return null;
    },
  );

  public serverErrorMsg: string = '';

  constructor(
    public dialogRef: MatDialogRef<ResetPasswordDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { token: string },
    private backend: BackendService,
    private snackbar: SnackbarService,
  ) {}

  public trySubmit() {
    const { username, token, password } = {
      username: this.form.get('username')!.value as string,
      password: this.form.get('password')!.value as string,
      token: this.data.token,
    };

    this.backend
      .confirmPasswordResetRequest(username, token, password)
      .then(() => {
        this.snackbar.showInfo('Your new password has been set! Try to log in!');
        this.dialogRef.close();
      })
      .catch((error: HttpErrorResponse) => {
        console.log(error);
        this.serverErrorMsg = error.error.toString();
      });
  }

  ngOnInit(): void {}
}
