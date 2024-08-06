import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { environment } from 'src/environment';
import { SafePipe } from '../../pipes/safe.pipe';

@Component({
  selector: 'app-explore-entity-dialog',
  templateUrl: './explore-entity-dialog.component.html',
  styleUrls: ['./explore-entity-dialog.component.scss'],
  standalone: true,
  imports: [SafePipe],
})
export class ExploreEntityDialogComponent {
  public viewerUrl: string;

  constructor(
    public dialogRef: MatDialogRef<ExploreEntityDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public id: string,
  ) {
    this.viewerUrl = `${environment.viewer_url}?entity=${this.id}&mode=explore`;
  }
}
