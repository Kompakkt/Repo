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
import { BackendService } from 'src/app/services';
import { TranslatePipe } from '../../pipes/translate.pipe';

import { MatButtonModule } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatFormField } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { NotificationService } from 'src/app/components/notification-area/notification-area.component';

@Component({
  selector: 'app-forgot-password-dialog',
  templateUrl: './forgot-password-dialog.component.html',
  styleUrls: ['./forgot-password-dialog.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatFormField,
    MatIcon,
    MatInputModule,
    MatButtonModule,
    TranslatePipe,
  ],
})
export class ForgotPasswordDialogComponent implements OnInit {
  public form = new FormGroup({
    username: new FormControl('', Validators.required),
  });

  public serverErrorMsg = '';

  constructor(
    private backend: BackendService,
    private notification: NotificationService,
    public dialogRef: MatDialogRef<ForgotPasswordDialogComponent>,
  ) {}

  public async trySubmit() {
    const username = this.form.get('username')!.value as string;

    this.backend
      .requestPasswordReset(username)
      .then(() => {
        this.notification.showNotification({
          message: 'Your password reset link has been sent to your mail!',
          type: 'info',
        });
        this.dialogRef.close(true);
      })
      .catch((error: HttpErrorResponse) => (this.serverErrorMsg = error.error.toString()));
  }

  ngOnInit(): void {}
}
