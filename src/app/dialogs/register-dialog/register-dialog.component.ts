import { Component, model, inject } from '@angular/core';
import { MatDialogRef, MatDialog } from '@angular/material/dialog';
import { AuthDialogComponent } from 'src/app/dialogs/auth-dialog/auth-dialog.component';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { OutlinedInputComponent } from 'src/app/components/outlined-input/outlined-input.component';
import { email, form, FormField, required, submit, validateTree } from '@angular/forms/signals';
import { CombinedFormErrorsComponent } from 'src/app/components/combined-form-errors/combined-form-errors.component';
import { BackendService } from 'src/app/services/backend.service';
import { AccountService } from 'src/app/services/account.service';

@Component({
  selector: 'app-register-dialog',
  templateUrl: './register-dialog.component.html',
  styleUrls: ['./register-dialog.component.scss'],
  imports: [
    FormField,
    OutlinedInputComponent,
    CombinedFormErrorsComponent,
    MatButtonModule,
    TranslatePipe,
    MatIconModule,
  ],
})
export class RegisterDialogComponent {
  #backend = inject(BackendService);
  #account = inject(AccountService);
  #dialog = inject(MatDialog);
  dialogRef = inject<MatDialogRef<RegisterDialogComponent>>(MatDialogRef);

  model = model({
    prename: '',
    surname: '',
    username: '',
    mail: '',
    password: '',
    passwordRepeat: '',
  });
  form = form(this.model, path => {
    required(path.prename);
    required(path.surname);
    required(path.username);
    required(path.mail);
    email(path.mail, { message: 'E-Mail address is not valid' });
    required(path.password);
    required(path.passwordRepeat);
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
    this.dialogRef.disableClose = true;
    const { username, password, mail, prename, surname } = this.form().value();
    const success = await submit(this.form, async form => {
      const registerSuccess = await this.#backend
        .registerAccount({
          username,
          password,
          mail,
          prename,
          surname,
          fullname: `${prename} ${surname}`,
        })
        .catch(() => ({ error: 'Failed to register account' }));
      if ('error' in registerSuccess) {
        return {
          kind: 'serverError',
          fieldTree: form,
          message: registerSuccess.error,
        };
      }

      return undefined;
    });

    if (!success) {
      this.dialogRef.disableClose = false;
      return;
    }
    const userdata = await this.#account.loginOrFetch({ username, password });
    this.dialogRef.disableClose = false;
    if (!userdata) return;

    this.dialogRef.close({ username, password });
  }

  openAuthDialog() {
    this.#dialog.open(AuthDialogComponent);
  }
}
