import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material';

import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-explore-entity-dialog',
  templateUrl: './explore-entity-dialog.component.html',
  styleUrls: ['./explore-entity-dialog.component.scss'],
})
export class ExploreEntityDialogComponent implements OnInit {
  public viewerUrl: string;

  constructor(
    private dialog: MatDialog,
    public dialogRef: MatDialogRef<ExploreEntityDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public id: string,
  ) {
    this.viewerUrl = `${environment.kompakkt_url}?entity=${this.id}?mode=explore`;
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  ngOnInit() {}
}
