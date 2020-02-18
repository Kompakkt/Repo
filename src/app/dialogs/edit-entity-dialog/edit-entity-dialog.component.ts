import { Component, Inject, OnInit } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialog,
} from '@angular/material/dialog';
import { environment } from '../../../environments/environment';

import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-edit-entity-dialog',
  templateUrl: './edit-entity-dialog.component.html',
  styleUrls: ['./edit-entity-dialog.component.scss'],
})
export class EditEntityDialogComponent implements OnInit {
  public viewerUrl: string;

  constructor(
    public dialogRef: MatDialogRef<EditEntityDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public id: string,
    private dialog: MatDialog,
  ) {
    this.viewerUrl = `${environment.kompakkt_url}?entity=${this.id}&mode=edit`;
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

  ngOnInit() {}
}
