import { Component, Inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
} from '@angular/material/dialog';
import { TranslateService } from '../../services/translate.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormField } from '@angular/material/form-field';

@Component({
  selector: 'app-password-protected-dialog',
  templateUrl: './password-protected-dialog.component.html',
  styleUrls: ['./password-protected-dialog.component.scss'],
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatFormField,
    MatInputModule,
    FormsModule,
    MatDialogActions,
    MatButtonModule,
    TranslatePipe,
  ],
})
export class PasswordProtectedDialogComponent {
  public password = '';

  constructor(
    public dialogRef: MatDialogRef<PasswordProtectedDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public message: string,
  ) {}
}
