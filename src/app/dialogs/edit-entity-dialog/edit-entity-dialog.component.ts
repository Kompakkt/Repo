import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { environment } from '../../../environments/environment';

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
  ) {
    this.viewerUrl = `${environment.kompakkt_url}?entity=${this.id}&mode=edit`;
  }

  ngOnInit() {}
}
