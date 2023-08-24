import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { environment } from '~environments';
import { ReplaySubject } from 'rxjs';

export type ViewerDialogData = {
  entity?: string;
  compilation?: string;
  mode?: 'upload' | 'explore' | 'edit' | 'annotation' | 'open';
};

@Component({
  selector: 'app-viewer-dialog',
  templateUrl: './viewer-dialog.component.html',
  styleUrls: ['./viewer-dialog.component.scss'],
})
export class ViewerDialogComponent {
  public viewerUrl$ = new ReplaySubject<string>(0);

  constructor(
    public dialogRef: MatDialogRef<ViewerDialogComponent>,
    @Inject(MAT_DIALOG_DATA) private data: ViewerDialogData,
  ) {
    const url = new URL(environment.viewer_url);
    for (const [key, value] of Object.entries(data)) {
      if (!value) continue;
      url.searchParams.set(key, value);
    }
    this.viewerUrl$.next(url.toString());
  }
}
