import {
  Component,
  computed,
  ElementRef,
  inject,
  OnInit,
  signal,
  viewChild,
  model,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';

import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ExtenderPluginManager } from '@kompakkt/plugins/extender';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { OutlinedInputComponent } from '../../components/outlined-input/outlined-input.component';
import { ExtenderSlotDirective } from '../../directives/extender-slot.directive';
import { form, FormField, required, submit } from '@angular/forms/signals';
import { getFormErrorMessages } from 'src/app/util/form-helpers';
import { ForgotUsernameDialogComponent } from '../forgot-username-dialog/forgot-username-dialog.component';
import { ForgotPasswordDialogComponent } from '../forgot-password-dialog/forgot-password-dialog.component';
import { RegisterDialogComponent } from '../register-dialog/register-dialog.component';
import { AccountService } from 'src/app/services/account.service';

export type AuthDialogData = {
  concern?: string;
  username?: string;
};

export type AuthDialogResult = {
  username: string;
  password: string;
};

@Component({
  selector: 'app-auth-dialog',
  templateUrl: './auth-dialog.component.html',
  styleUrls: ['./auth-dialog.component.scss'],
  imports: [
    FormField,
    MatFormFieldModule,
    MatInputModule,
    MatDividerModule,
    MatButtonModule,
    TranslatePipe,
    MatIconModule,
    OutlinedInputComponent,
    ExtenderSlotDirective,
  ],
})
export class AuthDialogComponent implements OnInit {
  dialogRef = inject(MatDialogRef<AuthDialogComponent>);
  account = inject(AccountService);
  #dialog = inject(MatDialog);

  hasAuthMethods = signal(false);

  data = inject<AuthDialogData>(MAT_DIALOG_DATA);
  concern = computed(() => this.data?.concern ?? '');

  authModel = model<AuthDialogResult>({ username: '', password: '' });
  authForm = form(this.authModel, path => {
    required(path.username, { message: 'Username is required' });
    required(path.password, { message: 'Password is required' });
  });
  authErrors = signal<string[]>([]);

  async trySubmit() {
    this.dialogRef.disableClose = true;
    const result = await submit(this.authForm, async field => {
      const userdata = await this.account.loginOrFetch(field().value());
      if (userdata) return;
      return { kind: 'serverError', message: 'Invalid username or password' };
    });
    this.dialogRef.disableClose = false;

    if (result) {
      this.dialogRef.close(this.authForm().value());
    } else {
      this.authErrors.set(getFormErrorMessages(this.authForm(), 'serverError'));
    }
  }

  public openForgotUsernameDialog() {
    this.#dialog.open(ForgotUsernameDialogComponent);
    this.dialogRef.close(false);
  }

  public openForgotPasswordDialog() {
    this.#dialog.open(ForgotPasswordDialogComponent);
    this.dialogRef.close(false);
  }

  public openRegistrationDialog() {
    this.#dialog.open(RegisterDialogComponent);
    this.dialogRef.close(false);
  }

  authMethodsSlotRef = viewChild.required<ElementRef<HTMLElement>>('authMethodsSlot');
  ngOnInit() {
    if (this.data?.username) this.authForm.username().value.set(this.data.username);

    this.hasAuthMethods.set(ExtenderPluginManager.hasComponentsForSlot('auth-method'));
    console.log('AuthDialogComponent', {
      hasAuthMethods: this.hasAuthMethods(),
      elementRef: this.authMethodsSlotRef(),
    });
  }
}
