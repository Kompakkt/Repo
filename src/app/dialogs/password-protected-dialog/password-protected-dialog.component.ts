import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslateService } from './../../services/translate/translate.service';

@Component({
  selector: 'app-password-protected-dialog',
  templateUrl: './password-protected-dialog.component.html',
  styleUrls: ['./password-protected-dialog.component.scss'],
})
export class PasswordProtectedDialogComponent {
  public password = '';

  constructor(
    private translate: TranslateService,
    public dialogRef: MatDialogRef<PasswordProtectedDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public message: string,
  ) {
    this.translate.use(window.navigator.language.split('-')[0]);
  }
}
