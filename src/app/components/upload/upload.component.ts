import { AsyncPipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { combineLatest, firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import { BrowserSupportService, UploadHandlerService } from 'src/app/services';
import { TranslatePipe } from '../../pipes/translate.pipe';

/* These interfaces are not fully implemented
 * but match the Web File API from MDN
 * where it's important */
// eslint-disable-next-line @typescript-eslint/naming-convention
interface FileSystem {
  name: string;
  root: FileSystemDirectoryEntry;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
interface FileSystemEntry {
  filesystem: FileSystem;
  fullPath: string;
  isDirectory: boolean;
  isFile: boolean;
  name: string;

  copyTo: () => void;
  getMetadata: () => { modificationTime: Date; size: number };
  getParent: () => FileSystemDirectoryEntry;
  moveTo: () => void;
  remove: () => void;
  toURL: () => string;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
interface FileSystemFileEntry extends FileSystemEntry {
  file: (successCallback: (_file: File) => void) => File;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
interface FileSystemDirectoryReader {
  readEntries: (
    successCallback: (entries: Array<FileSystemFileEntry | FileSystemDirectoryEntry>) => void,
  ) => void;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
interface FileSystemDirectoryEntry extends FileSystemEntry {
  createReader: () => FileSystemDirectoryReader;
  getDirectory: () => FileSystemDirectoryEntry;
  getFile: () => FileSystemFileEntry;
}

@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.scss'],
  imports: [
    MatIconModule,
    MatTooltipModule,
    MatButtonModule,
    MatTableModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    AsyncPipe,
    TranslatePipe,
  ],
})
export class UploadComponent {
  // Enable to only show uploaded files
  @Input('preview')
  public preview = false;

  public displayedColumns = ['name', 'size', 'checksum', 'progress'];

  public mediaTypeIcons: { [key: string]: string } = {
    'model': 'language',
    'cloud': 'cloud',
    'splat': 'cloud',
    'video': 'movie',
    'audio': 'audiotrack',
    'image': 'image',
    '': 'sentiment_dissatisfied',
  };
  public mediaTypeTexts: { [key: string]: string } = {
    'model': '3D Model',
    'cloud': 'Point cloud',
    'splat': '3D gaussian splatting',
    'video': 'Video file',
    'audio': 'Audio file',
    'image': 'Image file',
    '': 'We were unable to detect the type of media.',
  };

  constructor(
    public uploadHandler: UploadHandlerService,
    public browserSupport: BrowserSupportService,
  ) {}

  processingProgress$ = this.uploadHandler.processingProgress$.pipe(
    map(progress => ({ value: progress })),
  );

  mediaType$ = this.uploadHandler.mediaType$;

  isDetermined$ = this.mediaType$.pipe(map(type => type !== ''));

  isModelOrCloud$ = this.mediaType$.pipe(
    map(type => type === 'model' || type === 'splat' || type === 'cloud'),
  );

  isVideo$ = this.mediaType$.pipe(map(type => type === 'video'));

  isAudio$ = this.mediaType$.pipe(map(type => type === 'audio'));

  isImage$ = this.mediaType$.pipe(map(type => type === 'image'));

  displayMediaType$ = this.uploadHandler.queue$.pipe(map(queue => queue.length > 0));

  queue$ = this.uploadHandler.queue$.pipe(
    map(queue =>
      queue.map(item => ({
        name: item._file.name,
        size: item._file.size,
        progress$: item.progress$,
        checksum: item.checksum,
      })),
    ),
  );

  disableFileInput$ = combineLatest([
    this.uploadHandler.isUploading$,
    this.uploadHandler.uploadCompleted$,
  ]).pipe(map(arr => arr.some(obj => !!obj)));

  dragEvent(event: DragEvent, type: 'add' | 'remove') {
    event.preventDefault();
    event.stopPropagation();
    const dropzone = event.currentTarget as HTMLElement;
    if (type === 'add') {
      dropzone.classList.add('dragover');
    } else {
      dropzone.classList.remove('dragover');
    }
  }

  public async handleDragDrop(event: DragEvent) {
    const dropzone = event.currentTarget as HTMLElement;
    dropzone.classList.remove('dragover');
    event.preventDefault();
    if (!event.dataTransfer) return;
    if (event.dataTransfer.files.length === 0) return;

    const files: File[] = [];

    const readFile = async (fileEntry: FileSystemFileEntry) =>
      new Promise<void>((resolve, _) =>
        fileEntry.file((_f: File) => {
          files.push(_f);
          resolve();
        }),
      );

    const readDirectory = async (dirEntry: FileSystemDirectoryEntry) =>
      new Promise<void>((resolve, _) =>
        dirEntry.createReader().readEntries(async entries => {
          for (const _e of entries) {
            if (_e.isFile) {
              await readFile(_e as FileSystemFileEntry);
            }
            if (_e.isDirectory) {
              await readDirectory(_e as FileSystemDirectoryEntry);
            }
          }
          resolve();
        }),
      );

    for (let i = 0; i < event.dataTransfer.items.length; i++) {
      const item = event.dataTransfer.items[i];
      const entry = item.webkitGetAsEntry() as FileSystemFileEntry | FileSystemDirectoryEntry;

      if (entry.isDirectory) {
        await readDirectory(entry as FileSystemDirectoryEntry);
      } else {
        await readFile(entry as FileSystemFileEntry);
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
    fileInput.value = '';
  }

  private fileHandler(files: File[]) {
    firstValueFrom(this.uploadHandler.isEmpty$)
      .then(isEmpty => {
        return isEmpty || this.uploadHandler.resetQueue(true);
      })
      .then(reset => {
        if (reset) this.uploadHandler.addMultipleToQueue(files);
      });
  }
}
