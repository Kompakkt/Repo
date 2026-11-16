import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, model } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { NgxFluentPipe } from '@apappas1129/ngx-fluent';
import { OutlinedInputComponent } from 'src/app/components/outlined-input/outlined-input.component';
import { CombinedFormErrorsComponent } from 'src/app/components/combined-form-errors/combined-form-errors.component';
import { form, FormField, required, submit, validateTree } from '@angular/forms/signals';
import { BackendService } from 'src/app/services/backend.service';
import { SnackbarService } from 'src/app/services/snackbar.service';

@Component({
  selector: 'app-reset-password-dialog',
  templateUrl: './reset-password-dialog.component.html',
  styleUrls: ['./reset-password-dialog.component.scss'],
  imports: [
    FormField,
    OutlinedInputComponent,
    CombinedFormErrorsComponent,
    MatButtonModule,
    NgxFluentPipe,
  ],
})
export class ResetPasswordDialogComponent {
  dialogRef = inject<MatDialogRef<ResetPasswordDialogComponent>>(MatDialogRef);
  dialogData = inject<{ token: string }>(MAT_DIALOG_DATA);
  #backend = inject(BackendService);
  #snackbar = inject(SnackbarService);

  model = model({ username: '', password: '', passwordRepeat: '' });
  form = form(this.model, path => {
    required(path.password);
    required(path.passwordRepeat);
    required(path.username);

    validateTree(path, ctx => {
      if (ctx.value().password !== ctx.value().passwordRepeat) {
        return {
          kind: 'notEqual',
          fieldTree: ctx.fieldTree.password,
          message: 'Passwords do not match',
        };
      }
      return null;
    });
  });

  async trySubmit() {
    const success = await submit(this.form, async form => {
      const { username, password } = this.form().value();
      const token = this.dialogData.token;

      const error = await this.#backend
        .confirmPasswordResetRequest(username, token, password)
        .then(() => {})
        .catch((error: HttpErrorResponse) => error.error.toString());

      if (error) {
        return {
          kind: 'serverError',
          message: error,
          fieldTree: form,
        };
      }
    });

    if (!success) return;
    this.#snackbar.showInfo('Your new password has been set! Try to log in!');
    this.dialogRef.close();
  }
}
