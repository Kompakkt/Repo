import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import { BackendService, SnackbarService } from '~services';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-forgot-username-dialog',
  templateUrl: './forgot-username-dialog.component.html',
  styleUrls: ['./forgot-username-dialog.component.scss'],
})
export class ForgotUsernameDialogComponent implements OnInit {
  public form = new FormGroup({
    mail: new FormControl('', Validators.email),
  });

  public serverErrorMsg = '';

  constructor(
    private backend: BackendService,
    private snackbar: SnackbarService,
    private dialogRef: MatDialogRef<ForgotUsernameDialogComponent>,
  ) {}

  public async trySubmit() {
    const mail = this.form.get('mail')!.value as string;

    this.backend
      .forgotUsername(mail)
      .then(() => {
        this.snackbar.showInfo('Your username has been sent to your mail!');
        this.dialogRef.close(true);
      })
      .catch((error: HttpErrorResponse) => (this.serverErrorMsg = error.error.toString()));
  }

  ngOnInit(): void {}
}
