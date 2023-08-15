import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import { BackendService, SnackbarService } from '~services';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslateService } from './../../services/translate/translate.service';

@Component({
  selector: 'app-forgot-password-dialog',
  templateUrl: './forgot-password-dialog.component.html',
  styleUrls: ['./forgot-password-dialog.component.scss'],
})
export class ForgotPasswordDialogComponent implements OnInit {
  public form = new FormGroup({
    username: new FormControl('', Validators.required),
  });

  public serverErrorMsg = '';

  constructor(
    private translate: TranslateService,
    private backend: BackendService,
    private snackbar: SnackbarService,
    private dialogRef: MatDialogRef<ForgotPasswordDialogComponent>,
  ) {
    this.translate.use(window.navigator.language.split('-')[0]);
  }

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
