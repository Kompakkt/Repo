import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpEventType, HttpResponse } from '@angular/common/http';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import * as spark from 'spark-md5';

import { BackendService, UuidService, DialogHelperService } from './';
import { environment } from 'src/environments/environment';
import { IFile } from 'src/common';

interface IQFile {
  _file: File;
  isSuccess: boolean;
  isCancel: boolean;
  isError: boolean;
  progress: number;
  checksum: string;
  options: {
    token: string;
    relativePath: string;
    type: string;
  };
}

// Supported file formats
export const modelExts = ['.babylon', '.obj', '.stl', '.glb', '.gltf'];
export const imageExts = ['.jpg', '.jpeg', '.png', '.tga', '.gif', '.bmp'];
export const audioExts = ['.ogg', '.mp3', '.m4a', '.wav'];
export const videoExts = ['.webm', '.mp4', '.ogv'];

const calculateMD5 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const blobSlice =
      File.prototype.slice || File.prototype['mozSlice'] || File.prototype['webkitSlice'];
    const chunkSize = 2097152; // Read in chunks of 2MB
    const chunks = Math.ceil(file.size / chunkSize);
    const buffer = new spark.ArrayBuffer();
    let currentChunk = 0;
    const reader = new FileReader();

    reader.addEventListener('load', e => {
      buffer.append(e.target?.result as ArrayBuffer); // Append array buffer
      currentChunk++;

      if (currentChunk < chunks) {
        loadNext();
      } else {
        const hash = buffer.end();
        console.log('Computed MD5 checksum', hash);
        return resolve(hash);
      }
    });

    reader.addEventListener('error', () => {
      console.log(reader.error);
      return reject(`Could not calculate checksum for file ${file.name}`);
    });

    const loadNext = () => {
      const start = currentChunk * chunkSize;
      const end = start + chunkSize >= file.size ? file.size : start + chunkSize;

      reader.readAsArrayBuffer(blobSlice.call(file, start, end));
    };

    loadNext();
  });

@Injectable({
  providedIn: 'root',
})
export class UploadHandlerService {
  private uploadEndpoint = `${environment.server_url}upload/file`;

  private queueSubject = new BehaviorSubject<IQFile[]>([]);
  private uploadResultSubject = new BehaviorSubject<IFile[]>([]);
  private mediaType = new BehaviorSubject<string>('');
  private isUploading = new BehaviorSubject<boolean>(false);
  private uploadEnabled = new BehaviorSubject<boolean>(true);
  private uploadCompleted = new BehaviorSubject<boolean>(false);

  public shouldCancelInProgress = false;

  constructor(
    private backend: BackendService,
    private http: HttpClient,
    private UUID: UuidService,
    private helper: DialogHelperService,
  ) {
    this.queue$.subscribe(queue => console.log('Queue', queue));
    this.filenames$.subscribe(list => {
      const mediaType = this.determineMediaType(list);
      console.log('Determined mediaType', mediaType);
      this.setMediaType(mediaType);
    });

    combineLatest([
      this.queue$,
      this.isUploading$,
      this.uploadEnabled$,
      this.uploadCompleted$,
    ]).subscribe(async ([queue, isUploading, isEnabled, isCompleted]) => {
      if (!isEnabled) return;
      if (!isUploading) return;
      if (isCompleted) return;
      if (queue.length === 0) return;

      this.uploadEnabled.next(false);
      this.shouldCancelInProgress = false;

      let errorFreeUpload = true;
      const uploads = queue.map(item => {
        const formData = new FormData();
        formData.append('relativePath', item.options.relativePath);
        formData.append('token', item.options.token);
        formData.append('type', item.options.type);
        formData.append('file', item._file, item._file.name);
        formData.append('checksum', item.checksum);
        return new Promise<IQFile>((resolve, reject) => {
          this.uploadToEndpoint(formData).subscribe((event: any) => {
            if (this.shouldCancelInProgress || !errorFreeUpload) {
              return reject('Upload was cancelled');
            }
            if (event.type === HttpEventType.UploadProgress) {
              item.progress = Math.floor((event.loaded / event.total) * 100);
            } else if (event instanceof HttpResponse) {
              item.isSuccess = true;
              item.progress = 100;
              return resolve(item);
            } else if (event instanceof HttpErrorResponse) {
              item.isError = true;
              errorFreeUpload = false;
              return reject('Error occured during upload');
            }
          });
        });
      });

      Promise.all(uploads)
        .then(results => {
          console.log('Post upload queue', results);
          this.handleUploadCompleted();
        })
        .catch(error => {
          console.log('Upload failed', error);
          alert('Upload failed');
          this.resetQueue();
        });
    });
  }

  private uploadToEndpoint(formData: FormData) {
    return this.http.post(this.uploadEndpoint, formData, {
      withCredentials: true,
      observe: 'events',
      reportProgress: true,
    });
  }

  get mediaType$() {
    return this.mediaType.asObservable();
  }
  get isUploading$() {
    return this.isUploading.asObservable();
  }
  get uploadEnabled$() {
    return this.uploadEnabled.asObservable();
  }
  get uploadCompleted$() {
    return this.uploadCompleted.asObservable();
  }
  get queue$() {
    return this.queueSubject.asObservable();
  }
  get filenames$() {
    return this.queue$.pipe(map(files => files.map(item => item._file.name)));
  }
  get isEmpty$() {
    return this.queue$.pipe(map(files => files.length === 0));
  }
  get progress$() {
    return this.queue$.pipe(
      map(files => {
        if (files.length === 0) return 0;
        return files.reduce((acc, val) => acc + val.progress, 0) / files.length;
      }),
    );
  }
  get remaining$() {
    return this.queue$.pipe(map(files => files.filter(item => item.progress < 100).length));
  }
  get results$() {
    return this.uploadResultSubject.asObservable();
  }

  /**
   * Attempts to reset the queue and returns if the operation succeeded.
   * Also returns true if the current queue is empty.
   * @param {boolean} needConfirmation
   * Whether the user needs to confirm resetting the queue. Defaults to true.
   */
  public async resetQueue(needConfirmation = true) {
    const queue = this.queueSubject.getValue();
    if (queue.length === 0) return true;

    if (needConfirmation && queue.length > 0) {
      const confirmed = await this.helper.confirm(
        'This action will clear the current queue.\nContinue?',
      );
      if (!confirmed) return false;
    }

    this.shouldCancelInProgress = true;
    this.queueSubject.next([]);

    if (needConfirmation) {
      await this.backend
        .cancelUpload(this.UUID.UUID, this.mediaType.getValue())
        .then(() => {})
        .catch(err => console.error('Failed deleting files from server', err));
    }
    this.uploadEnabled.next(true);
    this.uploadCompleted.next(false);
    this.isUploading.next(false);
    this.UUID.reset();
    return true;
  }

  public startUpload() {
    const type = this.mediaType.getValue();
    if (!type) {
      // TODO: Dialog instead of alert
      alert('Mediatype could not be determined');
      return false;
    }

    this.shouldCancelInProgress = false;

    // Update headers to automatically determined mediatype
    const queue = this.queueSubject.getValue();
    this.queueSubject.next(queue.map(file => ({ ...file, options: { ...file.options, type } })));
    this.isUploading.next(true);
    return true;
  }

  public setMediaType(type: string) {
    this.mediaType.next(type);
  }

  private async fileToQueueable(_file: File): Promise<IQFile> {
    // https://developer.mozilla.org/en-US/docs/Web/API/File/webkitRelativePath
    // file as any since webkitRelativePath is experimental
    const relativePath = (_file as any)['webkitRelativePath'] ?? '';
    const token = this.UUID.UUID;
    const checksum = await calculateMD5(_file);
    const queueableFile: IQFile = {
      _file,
      progress: 0,
      isCancel: false,
      isSuccess: false,
      isError: false,
      checksum,
      options: {
        relativePath,
        token,
        type: this.mediaType.getValue(),
      },
    };
    return queueableFile;
  }

  private pushToQueue(files: IQFile[]) {
    const queue = this.queueSubject.getValue();
    queue.push(...files);
    this.queueSubject.next(queue);
  }

  public addToQueue(file: File) {
    if (!file) return console.warn('Invalid file', file);
    this.fileToQueueable(file)
      .then(file => this.pushToQueue([file]))
      .catch(err => console.error('Failed adding file to queue', err, file));
  }

  public addMultipleToQueue(files: File[]) {
    Promise.all(files.map(file => this.fileToQueueable(file)))
      .then(files => this.pushToQueue(files))
      .catch(err => console.error('Failed adding files to queue', err, files));
  }

  private async handleUploadCompleted() {
    this.uploadCompleted.next(true);
    this.isUploading.next(false);
    this.backend
      .completeUpload(this.UUID.UUID, this.mediaType.getValue())
      .then(result => {
        if (Array.isArray(result?.files)) {
          this.uploadResultSubject.next(result.files);
        } else {
          throw new Error('No files in server response');
        }
      })
      .catch(e => {
        console.error(e);
      });
  }

  public determineMediaType(filelist: string[]) {
    // Determine mediaType by extension
    const fileExts = filelist.map(f => f.slice(f.lastIndexOf('.')).toLowerCase());
    let model = 0,
      image = 0,
      video = 0,
      audio = 0;

    // Count file occurences
    for (const _ext of fileExts) {
      if (modelExts.includes(_ext)) model++;
      else if (imageExts.includes(_ext)) image++;
      else if (videoExts.includes(_ext)) video++;
      else if (audioExts.includes(_ext)) audio++;
      else model++;
    }

    // Since this is checking in order (3d model first)
    // we are able to determine models, even if e.g. textures are
    // also found
    if (model > 0) return 'model';
    if (image > 0) return 'image';
    if (video > 0) return 'video';
    if (audio > 0) return 'audio';
    return '';
  }
}
