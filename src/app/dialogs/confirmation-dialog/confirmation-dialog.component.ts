import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslateService } from './../../services/translate/translate.service';

@Component({
  selector: 'app-confirmation-dialog',
  templateUrl: './confirmation-dialog.component.html',
  styleUrls: ['./confirmation-dialog.component.scss'],
})
export class ConfirmationDialogComponent {
  constructor(
    private translate: TranslateService,
    public dialogRef: MatDialogRef<ConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public message: string,
  ) {
    this.translate.use(window.navigator.language.split('-')[0]);
  }

  get splitMessage() {
    return this.message.split('\n').map(v => v.trim());
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
