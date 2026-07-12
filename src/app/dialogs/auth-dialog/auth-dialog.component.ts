import {
  Component,
  computed,
  ElementRef,
  inject,
  OnInit,
  signal,
  viewChild,
} from "@angular/core";
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from "@angular/material/dialog";

import { MatButtonModule } from "@angular/material/button";
import { MatDividerModule } from "@angular/material/divider";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import {
  ExtenderPluginManager,
  ExtenderSlotManager,
} from "@kompakkt/plugins/extender";
import {
  ForgotPasswordDialogComponent,
  ForgotUsernameDialogComponent,
  RegisterDialogComponent,
} from "src/app/dialogs";
import { AccountService } from "src/app/services";
import { TranslatePipe } from "../../pipes/translate.pipe";
import { OutlinedInputComponent } from "../../components/outlined-input/outlined-input.component";
import { ExtenderSlotDirective } from "../../directives/extender-slot.directive";

export type AuthDialogData = {
  concern?: string;
  username?: string;
};

@Component({
  selector: "app-auth-dialog",
  templateUrl: "./auth-dialog.component.html",
  styleUrls: ["./auth-dialog.component.scss"],
  imports: [
    FormsModule,
    ReactiveFormsModule,
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

  public waitingForResponse = false;
  public loginFailed = false;

  hasAuthMethods = signal(false);

  data = inject<AuthDialogData>(MAT_DIALOG_DATA);
  concern = computed(() => this.data?.concern ?? "");

  public form = new FormGroup({
    username: new FormControl("", Validators.required),
    password: new FormControl("", Validators.required),
  });

  public async trySubmit() {
    const { username, password } = {
      username: this.form.get("username")!.value as string,
      password: this.form.get("password")!.value as string,
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

  authMethodsSlotRef =
    viewChild.required<ElementRef<HTMLElement>>("authMethodsSlot");
  ngOnInit() {
    if (this.data?.username)
      this.form.get("username")?.patchValue(this.data.username);

    this.hasAuthMethods.set(
      ExtenderPluginManager.hasComponentsForSlot("auth-method"),
    );
    console.log("AuthDialogComponent", {
      hasAuthMethods: this.hasAuthMethods(),
      elementRef: this.authMethodsSlotRef(),
    });
  }
}
