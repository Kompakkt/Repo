import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';

import { ConfirmationDialogComponent } from 'src/app/dialogs';
import { IEntity } from 'src/common';
import { environment } from 'src/environment';
import { SafePipe } from '../../pipes/safe.pipe';

@Component({
  selector: 'app-edit-entity-dialog',
  templateUrl: './edit-entity-dialog.component.html',
  styleUrls: ['./edit-entity-dialog.component.scss'],
  standalone: true,
  imports: [SafePipe],
})
export class EditEntityDialogComponent {
  public viewerUrl: string;

  constructor(
    public dialogRef: MatDialogRef<EditEntityDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: IEntity,
    private dialog: MatDialog,
  ) {
    const mode = this.data.finished && this.data.settings.preview !== '' ? 'edit' : 'upload';
    this.viewerUrl = `${environment.viewer_url}?entity=${this.data._id}&mode=${mode}`;
    this.dialogRef.backdropClick().subscribe(() =>
      this.dialog
        .open(ConfirmationDialogComponent, {
          data: 'Do you want to close the settings viewer?',
        })
        .afterClosed()
        .toPromise()
        .then(result => {
          if (result) this.dialogRef.close();
        }),
    );
  }
}
