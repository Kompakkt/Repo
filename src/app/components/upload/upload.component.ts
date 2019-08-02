import {
  Component,
  OnInit,
  SecurityContext,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

import { environment } from '../../../environments/environment';
import { UploadHandlerService } from '../../services/upload-handler.service';

@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.scss'],
})
export class UploadComponent implements OnInit {
  @ViewChild('babylonPreview', { static: false })
  babylonPreview: undefined | ElementRef<HTMLIFrameElement>;

  private babylonWindow: undefined | Window;

  public viewerUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
    `${environment.kompakkt_url}/?dragdrop=true` as string,
  );

  public UploadQueue: Array<{
    name: string;
    size: number;
    progress: number;
  }> = [];
  public displayedColumns = ['name', 'size', 'progress'];

  constructor(
    private sanitizer: DomSanitizer,
    public uploadHandler: UploadHandlerService,
  ) {
    this.uploadHandler.$FileQueue.subscribe(newQueue => {
      this.UploadQueue = newQueue.map(file => ({
        name: file._file.name,
        size: file._file.size,
        progress: file.progress,
      }));

      if (
        this.babylonPreview &&
        this.babylonPreview.nativeElement.contentWindow
      ) {
        this.babylonWindow = this.babylonPreview.nativeElement.contentWindow;
      }

      // Queue got reset
      if (this.UploadQueue.length === 0 && this.babylonWindow) {
        this.babylonWindow.postMessage(
          { type: 'resetQueue' },
          environment.kompakkt_url,
        );
        // Trigger reload of Viewer
        this.viewerUrl = this.sanitizer.bypassSecurityTrustResourceUrl(`${
          environment.kompakkt_url
        }/?dragdrop=true&dummy=${Date.now()}` as string);
      }
    });
  }

  ngOnInit() {}
}
