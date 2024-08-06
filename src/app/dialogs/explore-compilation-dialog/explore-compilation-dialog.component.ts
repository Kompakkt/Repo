import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { environment } from 'src/environment';
import { SafePipe } from '../../pipes/safe.pipe';

@Component({
  selector: 'app-explore-compilation-dialog',
  templateUrl: './explore-compilation-dialog.component.html',
  styleUrls: ['./explore-compilation-dialog.component.scss'],
  standalone: true,
  imports: [SafePipe],
})
export class ExploreCompilationDialogComponent {
  public viewerUrl: string;

  constructor(
    public dialogRef: MatDialogRef<ExploreCompilationDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: { entityId: string; collectionId: string },
  ) {
    // tslint:disable-next-line:max-line-length
    this.viewerUrl = `${environment.viewer_url}?compilation=${data.collectionId}&entity=${data.entityId}&mode=explore`;
  }
}
