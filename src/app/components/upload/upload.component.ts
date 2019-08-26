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
    environment.kompakkt_url.endsWith('index.html')
      ? (`${environment.kompakkt_url}?mode=dragdrop` as string)
      : (`${environment.kompakkt_url}/?mode=dragdrop` as string),
  );

  public displayedColumns = ['name', 'size', 'progress'];

  constructor(
    private sanitizer: DomSanitizer,
    public uploadHandler: UploadHandlerService,
  ) {
    this.uploadHandler.$FileQueue.subscribe(newQueue => {
      if (
        this.babylonPreview &&
        this.babylonPreview.nativeElement.contentWindow
      ) {
        this.babylonWindow = this.babylonPreview.nativeElement.contentWindow;
      }

      // Queue got reset
      if (this.getQueue().length === 0 && this.babylonWindow) {
        this.babylonWindow.postMessage(
          { type: 'resetQueue' },
          environment.kompakkt_url,
        );
        // Trigger reload of Viewer
        this.viewerUrl = this.sanitizer.bypassSecurityTrustResourceUrl(`${
          environment.kompakkt_url
        }/?mode=dragdrop&dummy=${Date.now()}` as string);
      }
    });
  }

  public getQueue = () =>
    this.uploadHandler.queue.map(item => ({
      name: item._file.name,
      size: item._file.size,
      progress: item.progress,
    }));

  ngOnInit() {}
}
