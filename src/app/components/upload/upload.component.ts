import { Component, Input } from '@angular/core';

import { UploadHandlerService } from '../../services/upload-handler.service';
import { BrowserSupportService } from '../../services/browser-support.service';

@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.scss'],
})
export class UploadComponent {
  // Enable to only show uploaded files
  @Input('preview')
  public preview = false;

  public displayedColumns = ['name', 'size', 'progress'];

  public mediaTypeIcons = {
    model: '3d_rotation',
    video: 'videocam',
    audio: 'audiotrack',
    image: 'image',
    '': 'sentiment_dissatisfied',
  };
  public mediaTypeTexts = {
    model: '3D Model(s) detected',
    video: 'Video file(s) detected',
    audio: 'Audio file(s) detected',
    image: 'Image file(s) detected',
    '': 'We were unable to detect the type of media.',
  };

  constructor(
    public uploadHandler: UploadHandlerService,
    public browserSupport: BrowserSupportService,
  ) {}

  public getMediaType = () => this.uploadHandler.mediaType;
  public displayMediaType = () => this.uploadHandler.queue.length > 0;

  public getQueue = () =>
    this.uploadHandler.queue.map(item => ({
      name: item._file.name,
      size: item._file.size,
      progress: item.progress,
    }));

  public async handleDragDrop(event: DragEvent) {
    event.preventDefault();
    if (!event.dataTransfer) {
      return;
    }

    if (event.dataTransfer.files.length === 0) {
      return;
    }

    const files: File[] = [];

    const readFile = async fileEntry =>
      new Promise<any>((resolve, _) =>
        fileEntry.file((_f: File) => {
          files.push(_f);
          return;
        }),
      );

    const readDirectory = async dirEntry =>
      new Promise<any>((resolve, _) =>
        dirEntry.createReader().readEntries(async (entries: any[]) => {
          for (const _e of entries) {
            if (_e.isFile) {
              await readFile(_e);
            }
            if (_e.isDirectory) {
              await readDirectory(_e);
            }
          }
          resolve();
        }),
      );

    for (let i = 0; i < event.dataTransfer.items.length; i++) {
      const item = event.dataTransfer.items[i];
      const entry = item.webkitGetAsEntry();

      if (entry.isDirectory) {
        await readDirectory(entry);
      } else {
        await readFile(entry);
      }
    }

    this.fileHandler(files);
  }

  public handleFileInput(fileInput: HTMLInputElement) {
    if (!fileInput.files) {
      alert('Failed getting files');
      return;
    }
    const files: File[] = [];
    for (let i = 0; i < fileInput.files.length; i++) {
      files.push(fileInput.files[i]);
    }
    this.fileHandler(files);
  }

  private fileHandler(files: File[]) {
    this.uploadHandler.resetQueue();
    files.forEach(file => {
      this.uploadHandler.addToQueue(file);
    });
  }
}
