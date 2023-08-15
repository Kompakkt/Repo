import { Component, Input } from '@angular/core';
import { combineLatest, firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import { UploadHandlerService, BrowserSupportService } from 'src/app/services';
import { TranslateService } from './../../services/translate/translate.service';

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
})
export class UploadComponent {
  // Enable to only show uploaded files
  @Input('preview')
  public preview = false;

  public displayedColumns = ['name', 'size', 'progress'];

  public mediaTypeIcons: { [key: string]: string } = {
    'model': '3d_rotation',
    'video': 'videocam',
    'audio': 'audiotrack',
    'image': 'image',
    '': 'sentiment_dissatisfied',
  };
  public mediaTypeTexts: { [key: string]: string } = {
    'model': '3D Model(s) detected',
    'video': 'Video file(s) detected',
    'audio': 'Audio file(s) detected',
    'image': 'Image file(s) detected',
    '': 'We were unable to detect the type of media.',
  };

  constructor(
    private translate: TranslateService,
    public uploadHandler: UploadHandlerService,
    public browserSupport: BrowserSupportService,
  ) {
    this.translate.use(window.navigator.language.split('-')[0]);
  }

  get mediaType$() {
    return this.uploadHandler.mediaType$;
  }

  get isDetermined$() {
    return this.mediaType$.pipe(map(type => type !== ''));
  }

  get isModel$() {
    return this.mediaType$.pipe(map(type => type === 'model'));
  }

  get isVideo$() {
    return this.mediaType$.pipe(map(type => type === 'video'));
  }

  get isAudio$() {
    return this.mediaType$.pipe(map(type => type === 'audio'));
  }

  get isImage$() {
    return this.mediaType$.pipe(map(type => type === 'image'));
  }

  get displayMediaType$() {
    return this.uploadHandler.queue$.pipe(map(queue => queue.length > 0));
  }

  get queue$() {
    return this.uploadHandler.queue$.pipe(
      map(queue =>
        queue.map(item => ({
          name: item._file.name,
          size: item._file.size,
          progress: item.progress,
        })),
      ),
    );
  }

  get disableFileInput$() {
    return combineLatest([
      this.uploadHandler.isUploading$,
      this.uploadHandler.uploadCompleted$,
    ]).pipe(map(arr => arr.some(obj => !!obj)));
  }

  public async handleDragDrop(event: DragEvent) {
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
