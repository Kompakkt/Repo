import { Component, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';

import { HttpErrorResponse } from '@angular/common/http';
import { BackendService, SnackbarService } from 'src/app/services';
import { TranslatePipe } from '../../pipes/translate.pipe';

import { MatButton } from '@angular/material/button';
import { MatFormField } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';

@Component({
  selector: 'app-forgot-password-dialog',
  templateUrl: './forgot-password-dialog.component.html',
  styleUrls: ['./forgot-password-dialog.component.scss'],
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, MatFormField, MatInput, MatButton, TranslatePipe],
})
export class ForgotPasswordDialogComponent implements OnInit {
  public form = new FormGroup({
    username: new FormControl('', Validators.required),
  });

  public serverErrorMsg = '';

  constructor(
    private backend: BackendService,
    private snackbar: SnackbarService,
    private dialogRef: MatDialogRef<ForgotPasswordDialogComponent>,
  ) {}

  public async trySubmit() {
    const username = this.form.get('username')!.value as string;

    this.backend
      .requestPasswordReset(username)
      .then(() => {
        this.snackbar.showInfo('Your password reset link has been sent to your mail!');
        this.dialogRef.close(true);
      })
      .catch((error: HttpErrorResponse) => (this.serverErrorMsg = error.error.toString()));
  }

  ngOnInit(): void {}
}
