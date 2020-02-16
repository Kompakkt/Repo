import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-password-protected-dialog',
  templateUrl: './password-protected-dialog.component.html',
  styleUrls: ['./password-protected-dialog.component.scss'],
})
export class PasswordProtectedDialogComponent {
  public password = '';

  constructor(
    public dialogRef: MatDialogRef<PasswordProtectedDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public message: string,
  ) {}
}
