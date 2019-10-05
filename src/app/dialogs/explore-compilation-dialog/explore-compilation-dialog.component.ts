import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';

import {environment} from '../../../environments/environment';

@Component({
  selector: 'app-explore-compilation-dialog',
  templateUrl: './explore-compilation-dialog.component.html',
  styleUrls: ['./explore-compilation-dialog.component.scss'],
})
export class ExploreCompilationDialogComponent implements OnInit {

  public viewerUrl: string;

  constructor(
      public dialogRef: MatDialogRef<ExploreCompilationDialogComponent>,
      @Inject(MAT_DIALOG_DATA) public data,
  ) {
    console.log(data);
    // tslint:disable-next-line:max-line-length
    this.viewerUrl = `${environment.kompakkt_url}?collection=${data.collectionId}&entity=${data.entityId}&mode=explore`;
  }

  ngOnInit() {}
}
