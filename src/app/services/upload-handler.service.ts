import { HttpClient, HttpErrorResponse, HttpEventType, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import * as spark from 'spark-md5';

import { IFile } from 'src/common';
import { environment } from 'src/environment';
import { BackendService, DialogHelperService, UuidService } from './';

interface IQFile {
  _file: File;
  isSuccess: boolean;
  isCancel: boolean;
  isError: boolean;
  progress$: BehaviorSubject<number>;
  checksum: string;
  existsOnServer: boolean;
  options: {
    token: string;
    relativePath: string;
    type: string;
  };
}

// Supported file formats
export const supportedFileFormats: Record<string, string[]> = {
  model: ['obj', 'stl', 'glb', 'gltf'],
  cloud: ['laz', 'las'],
  splat: ['splat', 'spz', 'ply'],
  image: ['jpg', 'jpeg', 'png', 'tga', 'gif', 'bmp'],
  audio: ['ogg', 'mp3', 'm4a', 'wav'],
  video: ['webm', 'mp4', 'ogv'],
};

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
  private processingProgress = new BehaviorSubject<number>(-1);

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
              item.progress$.next(Math.floor((event.loaded / event.total) * 100));
            } else if (event instanceof HttpResponse) {
              item.isSuccess = true;
              item.progress$.next(100);
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
          return this.handleUploadCompleted();
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

  mediaType$ = this.mediaType.asObservable();
  isUploading$ = this.isUploading.asObservable();
  uploadEnabled$ = this.uploadEnabled.asObservable();
  uploadCompleted$ = this.uploadCompleted.asObservable();
  processingProgress$ = this.processingProgress.asObservable();
  queue$ = this.queueSubject.asObservable();
  filenames$ = this.queue$.pipe(map(files => files.map(item => item._file.name)));
  isEmpty$ = this.queue$.pipe(map(files => files.length === 0));
  progress$ = this.queue$.pipe(
    map(files => combineLatest(files.map(file => file.progress$))),
    switchMap(progresses => progresses),
    map(progresses => progresses.reduce((acc, curr) => acc + curr, 0) / progresses.length),
  );
  results$ = this.uploadResultSubject.asObservable();

  /**
   * Attempts to reset the queue and returns if the operation succeeded.
   * Also returns true if the current queue is empty.
   * @param {boolean} needConfirmation
   * Whether the user needs to confirm resetting the queue. Defaults to true.
   */
  public async resetQueue(needConfirmation = true) {
    const mediaType = this.mediaType.getValue();
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
        .cancelUpload(this.UUID.UUID, mediaType)
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

  private async initiateChecksumCalculation(file: File) {
    const checksum = await calculateMD5(file);
    const existingOnServer = await this.backend.checkIfChecksumExists(checksum);

    const queue = this.queueSubject.getValue();
    const fileIndex = queue.findIndex(item => item._file === file);

    if (fileIndex !== -1) {
      queue[fileIndex] = {
        ...queue[fileIndex],
        checksum,
        existsOnServer: !!existingOnServer.existing,
      };
      this.queueSubject.next([...queue]);
      console.log('Updated checksum in queue', queue[fileIndex], this.queueSubject.getValue());
    } else {
      console.error('File not found in queue');
    }
  }

  private async fileToQueueable(_file: File): Promise<IQFile> {
    // https://developer.mozilla.org/en-US/docs/Web/API/File/webkitRelativePath
    // file as any since webkitRelativePath is experimental
    const relativePath = (_file as any)['webkitRelativePath'] ?? '';
    const token = this.UUID.UUID;
    this.initiateChecksumCalculation(_file);

    const queueableFile: IQFile = {
      _file,
      progress$: new BehaviorSubject(0),
      isCancel: false,
      isSuccess: false,
      isError: false,
      existsOnServer: false,
      checksum: '',
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
    const uuid = this.UUID.UUID;
    const type = this.mediaType.getValue();

    const queueUploadResult = await this.backend.processUpload(uuid, type);
    console.log('queueUploadResult', queueUploadResult);
    if (queueUploadResult.requiresProcessing) {
      await new Promise<void>(async (resolve, reject) => {
        const getInfo = async () => {
          const info = await this.backend.processInfo(uuid, type);
          this.processingProgress.next(info.progress);
          if (info.progress === 100 || info.status === 'DONE') {
            resolve();
          } else if (info.progress < 0 || info.status === 'ERROR') {
            reject(new Error('Upload failed during processing'));
          } else {
            setTimeout(getInfo, 1000);
          }
        };
        setTimeout(getInfo, 0);
      });
    }

    const completeUploadResult = await this.backend.completeUpload(uuid, type);
    this.uploadCompleted.next(true);
    this.isUploading.next(false);
    if (Array.isArray(completeUploadResult?.files)) {
      this.uploadResultSubject.next(completeUploadResult.files);
    } else {
      throw new Error('No files in server response');
    }
  }

  public determineMediaType(filelist: string[]) {
    // Determine mediaType by extension
    const count = {
      model: 0,
      cloud: 0,
      image: 0,
      video: 0,
      audio: 0,
      splat: 0,
    };

    // Count file occurences
    for (const file of filelist) {
      for (const [type, extensions] of Object.entries(supportedFileFormats)) {
        if (extensions.some(e => file.endsWith(e))) {
          count[type]++;
          break;
        }
      }
    }

    // Since this is checking in order (3d model first)
    // we are able to determine models, even if e.g. textures are
    // also found
    if (count.model > 0) return 'model';
    if (count.splat > 0) return 'splat';
    if (count.cloud > 0) return 'cloud';
    if (count.image > 0) return 'image';
    if (count.video > 0) return 'video';
    if (count.audio > 0) return 'audio';
    return '';
  }
}
