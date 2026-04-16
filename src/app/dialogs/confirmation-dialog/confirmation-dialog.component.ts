import { Component, Inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogContent,
  MatDialogClose,
} from '@angular/material/dialog';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { MatButtonModule } from '@angular/material/button';

interface IConfirmationDialogData {
  title?: string;
  message: string;
}

@Component({
  selector: 'app-confirmation-dialog',
  templateUrl: './confirmation-dialog.component.html',
  styleUrls: ['./confirmation-dialog.component.scss'],
  imports: [
    MatDialogContent,
    MatButtonModule,
    MatDialogClose,
    TranslatePipe,
  ],
})
export class ConfirmationDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: string | IConfirmationDialogData,
  ) {}

  get title() {
    if (typeof this.data === 'string') return undefined;
    const title = this.data.title?.trim();
    return title ? title : undefined;
  }

  get message() {
    return typeof this.data === 'string' ? this.data : this.data.message;
  }

  get splitMessage() {
    return this.message.split('\n').map(v => v.trim());
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
