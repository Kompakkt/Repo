import { Component, computed, inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SafePipe } from 'src/app/pipes';
import { getViewerUrl } from 'src/app/util/get-viewer-url';

export type ViewerDialogData = {
  entity?: string;
  compilation?: string;
  mode?: 'upload' | 'explore' | 'edit' | 'annotation' | 'open';
};

@Component({
  selector: 'app-viewer-dialog',
  imports: [SafePipe],
  templateUrl: './viewer-dialog.component.html',
  styleUrl: './viewer-dialog.component.scss',
})
export class ViewerDialogComponent {
  data = inject<ViewerDialogData>(MAT_DIALOG_DATA);

  viewerUrl = computed(() => {
    const data = this.data;
    const url = new URL(getViewerUrl());
    for (const [key, value] of Object.entries(data)) {
      if (!value) continue;
      url.searchParams.set(key, value);
    }
    return url.toString();
  });
}
