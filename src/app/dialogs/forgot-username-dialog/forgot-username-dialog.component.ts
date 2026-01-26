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
  selector: 'app-forgot-username-dialog',
  templateUrl: './forgot-username-dialog.component.html',
  styleUrls: ['./forgot-username-dialog.component.scss'],
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
export class ForgotUsernameDialogComponent implements OnInit {
  public form = new FormGroup({
    mail: new FormControl('', Validators.email),
  });

  public serverErrorMsg = '';

  constructor(
    private backend: BackendService,
    private notification: NotificationService,
    public dialogRef: MatDialogRef<ForgotUsernameDialogComponent>,
  ) {}

  public async trySubmit() {
    const mail = this.form.get('mail')!.value as string;
    await this.backend
      .forgotUsername(mail)
      .then(() => {
        this.notification.showNotification({
          message: 'Your username has been sent to your mail!',
          type: 'info',
        });
        this.dialogRef.close(true);
      })
      .catch((error: HttpErrorResponse) => (this.serverErrorMsg = error.error.toString()));
  }

  ngOnInit(): void {}
}
