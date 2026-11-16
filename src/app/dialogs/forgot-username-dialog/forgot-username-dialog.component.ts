import { Component, inject, model } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { NgxFluentPipe } from '@apappas1129/ngx-fluent';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { form, FormField, required, submit } from '@angular/forms/signals';
import { CombinedFormErrorsComponent } from 'src/app/components/combined-form-errors/combined-form-errors.component';
import { OutlinedInputComponent } from 'src/app/components/outlined-input/outlined-input.component';
import { BackendService } from 'src/app/services/backend.service';
import { SnackbarService } from 'src/app/services/snackbar.service';

@Component({
  selector: 'app-forgot-username-dialog',
  templateUrl: './forgot-username-dialog.component.html',
  styleUrls: ['./forgot-username-dialog.component.scss'],
  imports: [
    FormField,
    MatIconModule,
    CombinedFormErrorsComponent,
    OutlinedInputComponent,
    MatButtonModule,
    NgxFluentPipe,
  ],
})
export class ForgotUsernameDialogComponent {
  #backend = inject(BackendService);
  #snackbar = inject(SnackbarService);
  dialogRef = inject<MatDialogRef<ForgotUsernameDialogComponent>>(MatDialogRef);

  mailModel = model('');
  mailForm = form(this.mailModel, path => {
    required(path);
  });

  async trySubmit() {
    const success = await submit(this.mailForm, async form => {
      const mail = form().value();
      const result = await this.#backend
        .forgotUsername(mail)
        .then(() => {})
        .catch((error: HttpErrorResponse) => error.error.toString());

      if (result) {
        return {
          kind: 'serverError',
          fieldTree: form,
          message: result,
        };
      }

      return undefined;
    });

    if (!success) return;
    this.#snackbar.showInfo('Your username has been sent to your mail!');
    this.dialogRef.close(true);
  }
}
