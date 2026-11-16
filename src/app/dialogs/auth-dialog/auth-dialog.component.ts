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
import { NgxFluentPipe } from '@apappas1129/ngx-fluent';
import { OutlinedInputComponent } from '../../components/outlined-input/outlined-input.component';
import { ExtenderSlotDirective } from '../../directives/extender-slot.directive';
import { form, FormField, required, submit } from '@angular/forms/signals';
import { CombinedFormErrorsComponent } from '../../components/combined-form-errors/combined-form-errors.component';
import { ForgotUsernameDialogComponent } from '../forgot-username-dialog/forgot-username-dialog.component';
import { ForgotPasswordDialogComponent } from '../forgot-password-dialog/forgot-password-dialog.component';
import { RegisterDialogComponent } from '../register-dialog/register-dialog.component';
import { AccountService } from 'src/app/services/account.service';

export type AuthDialogData = {
  concern?: string;
  concernArgs?: Record<string, unknown>;
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
    NgxFluentPipe,
    MatIconModule,
    OutlinedInputComponent,
    CombinedFormErrorsComponent,
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
  concernArgs = computed(() => this.data?.concernArgs ?? {});

  authModel = model<AuthDialogResult>({ username: '', password: '' });
  authForm = form(this.authModel, path => {
    required(path.username, { message: 'auth-dialog-username-required' });
    required(path.password, { message: 'auth-dialog-password-required' });
  });

  async trySubmit() {
    this.dialogRef.disableClose = true;
    const result = await submit(this.authForm, async field => {
      const userdata = await this.account.loginOrFetch(field().value());
      if (userdata) return;
      return { kind: 'serverError', message: 'auth-dialog-error-invalid-credentials' };
    });
    this.dialogRef.disableClose = false;

    if (result) {
      this.dialogRef.close(this.authForm().value());
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
