import { Component, inject, model } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { form, FormField, required, submit } from '@angular/forms/signals';
import { OutlinedInputComponent } from 'src/app/components/outlined-input/outlined-input.component';
import { CombinedFormErrorsComponent } from 'src/app/components/combined-form-errors/combined-form-errors.component';
import { BackendService } from 'src/app/services/backend.service';
import { SnackbarService } from 'src/app/services/snackbar.service';

@Component({
  selector: 'app-forgot-password-dialog',
  templateUrl: './forgot-password-dialog.component.html',
  styleUrls: ['./forgot-password-dialog.component.scss'],
  imports: [
    CombinedFormErrorsComponent,
    OutlinedInputComponent,
    FormField,
    MatIconModule,
    MatButtonModule,
    TranslatePipe,
  ],
})
export class ForgotPasswordDialogComponent {
  #backend = inject(BackendService);
  #snackbar = inject(SnackbarService);
  dialogRef = inject<MatDialogRef<ForgotPasswordDialogComponent>>(MatDialogRef);

  usernameModel = model('');
  usernameForm = form(this.usernameModel, path => {
    required(path);
  });

  async trySubmit() {
    const success = await submit(this.usernameForm, async form => {
      const username = form().value();
      const result = await this.#backend
        .requestPasswordReset(username)
        .then(() => {})
        .catch((error: HttpErrorResponse) => error.error.toString());

      if (result) {
        return {
          kind: 'serverError',
          message: result,
          fieldTree: form,
        };
      }
      return undefined;
    });

    if (!success) return;
    this.#snackbar.showInfo('Your password reset link has been sent to your mail!');
    this.dialogRef.close(true);
  }
}
