import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';

import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-explore-entity-dialog',
  templateUrl: './explore-entity-dialog.component.html',
  styleUrls: ['./explore-entity-dialog.component.scss'],
})
export class ExploreEntityDialogComponent implements OnInit {
  public viewerUrl: string;

  constructor(
    public dialogRef: MatDialogRef<ExploreEntityDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public id: string,
  ) {
    this.viewerUrl = `${environment.kompakkt_url}?entity=${this.id}&mode=explore`;
  }

  ngOnInit() {}
}
