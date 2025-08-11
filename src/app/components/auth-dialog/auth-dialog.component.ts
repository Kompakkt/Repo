import { Component, computed, inject, OnInit, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';

import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormField } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ExtenderSlotDirective, PLUGIN_MANAGER } from '@kompakkt/extender';
import {
  ForgotPasswordDialogComponent,
  ForgotUsernameDialogComponent,
  RegisterDialogComponent,
} from 'src/app/dialogs';
import { AccountService } from 'src/app/services';
import { TranslatePipe } from '../../pipes/translate.pipe';

export type AuthDialogData = {
  concern?: string;
  username?: string;
};

@Component({
  selector: 'app-auth-dialog',
  templateUrl: './auth-dialog.component.html',
  styleUrls: ['./auth-dialog.component.scss'],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatFormField,
    MatInputModule,
    MatDividerModule,
    MatButtonModule,
    TranslatePipe,
    ExtenderSlotDirective,
    MatIcon,
  ],
})
export class AuthDialogComponent implements OnInit {
  dialogRef = inject(MatDialogRef<AuthDialogComponent>);
  account = inject(AccountService);
  #dialog = inject(MatDialog);

  public waitingForResponse = false;
  public loginFailed = false;

  extenderPluginManager = inject(PLUGIN_MANAGER);
  hasAuthMethods = signal(false);

  data = inject<AuthDialogData>(MAT_DIALOG_DATA);
  concern = computed(() => this.data?.concern ?? '');

  public form = new FormGroup({
    username: new FormControl('', Validators.required),
    password: new FormControl('', Validators.required),
  });

  public async trySubmit() {
    const { username, password } = {
      username: this.form.get('username')!.value as string,
      password: this.form.get('password')!.value as string,
    };

    this.waitingForResponse = true;
    this.dialogRef.disableClose = true;

    const userdata = await this.account.loginOrFetch({ username, password });

    this.dialogRef.disableClose = false;
    this.waitingForResponse = false;

    this.loginFailed = !userdata;
    if (!userdata) return;

    this.dialogRef.close({ username, password });
  }

  public openForgotUsernameDialog() {
    this.#dialog.open(ForgotUsernameDialogComponent);
  }

  public openForgotPasswordDialog() {
    this.#dialog.open(ForgotPasswordDialogComponent);
  }

  public openRegistrationDialog() {
    this.#dialog.open(RegisterDialogComponent);
  }

  ngOnInit() {
    if (this.data?.username) this.form.get('username')?.patchValue(this.data.username);

    console.log(this.hasAuthMethods());
    this.hasAuthMethods.set(this.extenderPluginManager.hasComponentsForSlot('auth-method'));
  }
}
