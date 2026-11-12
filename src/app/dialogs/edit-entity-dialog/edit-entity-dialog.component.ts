import { Component, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { IEntity } from '@kompakkt/common';
import { environment } from 'src/environment';
import { SafePipe } from '../../pipes/safe.pipe';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-edit-entity-dialog',
  templateUrl: './edit-entity-dialog.component.html',
  styleUrls: ['./edit-entity-dialog.component.scss'],
  imports: [SafePipe],
})
export class EditEntityDialogComponent {
  dialogRef = inject<MatDialogRef<EditEntityDialogComponent>>(MatDialogRef);
  data = inject<IEntity>(MAT_DIALOG_DATA);
  #dialog = inject(MatDialog);

  viewerUrl = signal('');

  constructor() {
    const mode = this.data.finished && this.data.settings.preview !== '' ? 'edit' : 'upload';
    this.viewerUrl.set(`${environment.viewer_url}?entity=${this.data._id}&mode=${mode}`);
    this.dialogRef.backdropClick().subscribe(() =>
      this.#dialog
        .open(ConfirmationDialogComponent, {
          data: {
            title: 'Close settings viewer',
            message: 'Do you want to close the settings' + '\n' + 'viewer?',
          },
        })
        .afterClosed()
        .toPromise()
        .then(result => {
          if (result) this.dialogRef.close();
        }),
    );
  }
}
