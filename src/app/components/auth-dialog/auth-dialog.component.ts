import { Component, Inject, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';

import {
  ForgotPasswordDialogComponent,
  ForgotUsernameDialogComponent,
  RegisterDialogComponent,
} from 'src/app/dialogs';
import { AccountService } from 'src/app/services';
import { TranslatePipe } from '../../pipes/translate.pipe';

import { MatButton } from '@angular/material/button';
import { MatFormField } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-auth-dialog',
  templateUrl: './auth-dialog.component.html',
  styleUrls: ['./auth-dialog.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatFormField,
    MatInputModule,
    MatDividerModule,
    MatButton,
    TranslatePipe,
  ],
})
export class AuthDialogComponent implements OnInit {
  public waitingForResponse = false;
  public loginFailed = false;

  public form = new FormGroup({
    username: new FormControl('', Validators.required),
    password: new FormControl('', Validators.required),
  });

  constructor(
    public dialogRef: MatDialogRef<AuthDialogComponent>,
    public account: AccountService,
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data?: { concern?: string; username?: string },
  ) {}

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
    this.dialog.open(ForgotUsernameDialogComponent);
  }

  public openForgotPasswordDialog() {
    this.dialog.open(ForgotPasswordDialogComponent);
  }

  public openRegistrationDialog() {
    this.dialog.open(RegisterDialogComponent);
  }

  get concern() {
    return this.data?.concern ?? '';
  }

  ngOnInit() {
    if (this.data?.username) this.form.get('username')?.patchValue(this.data.username);
  }
}
