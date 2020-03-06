import { Component, Inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialog,
} from '@angular/material/dialog';
import { environment } from '../../../environments/environment';
import { IEntity } from '../../interfaces';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-edit-entity-dialog',
  templateUrl: './edit-entity-dialog.component.html',
  styleUrls: ['./edit-entity-dialog.component.scss'],
})
export class EditEntityDialogComponent {
  public viewerUrl: string;

  constructor(
    public dialogRef: MatDialogRef<EditEntityDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: IEntity,
    private dialog: MatDialog,
  ) {
    const mode =
      this.data.finished && this.data.settings.preview !== ''
        ? 'edit'
        : 'upload';
    this.viewerUrl = `${environment.kompakkt_url}?entity=${this.data._id}&mode=${mode}`;
    this.dialogRef.backdropClick().subscribe(_ => {
      const confirm = this.dialog
        .open(ConfirmationDialogComponent, {
          data: `Do you want to close the settings viewer?`,
        })
        .afterClosed()
        .toPromise()
        .then(result => {
          if (result) this.dialogRef.close();
        });
    });
  }
}
