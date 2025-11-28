import { HttpClient, HttpErrorResponse, HttpEventType, HttpResponse } from '@angular/common/http';
import { computed, effect, Injectable, signal } from '@angular/core';
import { map, switchMap } from 'rxjs/operators';
import spark from 'spark-md5';
import ObjectID from 'bson-objectid';

import { toObservable } from '@angular/core/rxjs-interop';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { IFile } from 'src/common';
import { getServerUrl } from '../util/get-server-url';
import { BackendService, DialogHelperService } from './';

interface IQFile {
  _file: File;
  isSuccess: boolean;
  isCancel: boolean;
  isError: boolean;
  progress$: BehaviorSubject<{ value: number }>;
  checksum: string;
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
  splat: ['splat', 'spz', 'spx', 'ply'],
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
  private uploadEndpoint = getServerUrl(`upload/file`);

  readonly queue = signal<IQFile[]>([]);
  readonly queue$ = toObservable(this.queue);
  readonly uploadResults = signal<IFile[]>([]);
  readonly isUploading = signal<boolean>(false);
  readonly uploadEnabled = signal<boolean>(true);
  readonly uploadCompleted = signal<boolean>(false);
  readonly processingProgress = signal<{ value: number }>({ value: -1 });
  readonly mediaType = signal<string>('');

  readonly uuid = signal<string>(new ObjectID().toString());

  public shouldCancelInProgress = false;

  constructor(
    private backend: BackendService,
    private http: HttpClient,
    private helper: DialogHelperService,
  ) {
    effect(
      () => {
        const queue = this.queue();
        const filenames = queue.map(item => item._file.name);
        const mediaType = this.determineMediaType(filenames);
        console.log('Updated queue', queue, 'Determined mediatype', mediaType);
        this.setMediaType(mediaType);
      },
      { allowSignalWrites: true },
    );

    effect(() => {
      const isEnabled = this.uploadEnabled();
      const isUploading = this.isUploading();
      const isCompleted = this.uploadCompleted();
      const queue = this.queue();

      if (!isEnabled) return;
      if (!isUploading) return;
      if (isCompleted) return;
      if (queue.length === 0) return;

      this.uploadEnabled.set(false);
      this.shouldCancelInProgress = false;

      const relativePathSegments = queue.map(item => item.options.relativePath.split('/'));
      const sameSegments = relativePathSegments.map((segments, index) => {
        if (segments.length > 1) {
          for (let i = 0; i < segments.length; i++) {
            const segment = segments[i];
            if (relativePathSegments.every(other => other.at(i) === segment)) continue;
            return i;
          }
        }
        return 0;
      });
      const minSameSegments = Math.min(...sameSegments);

      let errorFreeUpload = true;
      const uploads = queue.map(item => {
        const formData = new FormData();
        const normalizedRelativePath = item.options.relativePath
          .split('/')
          .slice(minSameSegments)
          .join('/');
        formData.append('relativePath', normalizedRelativePath);
        formData.append('token', item.options.token);
        formData.append('type', item.options.type);
        formData.append('file', item._file, item._file.name);
        return new Promise<IQFile>((resolve, reject) => {
          this.http
            .post(this.uploadEndpoint, formData, {
              withCredentials: true,
              observe: 'events',
              reportProgress: true,
            })
            .subscribe(event => {
              if (this.shouldCancelInProgress || !errorFreeUpload) {
                return reject('Upload was cancelled');
              }
              if (event.type === HttpEventType.UploadProgress) {
                item.progress$.next({
                  value: Math.floor((event.loaded / (event.total ?? 1)) * 100),
                });
              } else if (event instanceof HttpResponse) {
                if (
                  typeof event.body === 'object' &&
                  event.body !== null &&
                  'serverChecksum' in event.body
                ) {
                  const serverChecksum = event.body.serverChecksum;
                  if (serverChecksum !== item.checksum) {
                    console.error(
                      'Checksum mismatch',
                      item._file.name,
                      'Client:',
                      item.checksum,
                      'Server:',
                      serverChecksum,
                    );
                    item.isError = true;
                    errorFreeUpload = false;
                    alert(`Checksum mismatch for file ${item._file.name}. Upload aborted.`);
                    return reject('Checksum mismatch');
                  }
                } else {
                  console.warn('No server checksum in response', event);
                }
                item.isSuccess = true;
                item.progress$.next({ value: 100 });
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

  filenames = computed(() => {
    const queue = this.queue();
    return queue.map(item => item._file.name);
  });
  isEmpty = computed(() => {
    const queue = this.queue();
    return queue.length === 0;
  });
  hasItems = computed(() => {
    const isEmpty = this.isEmpty();
    return !isEmpty;
  });
  hasAllChecksums = computed(() => {
    const queue = this.queue();
    return queue.every(item => item.checksum && item.checksum.length > 0);
  });
  progress$ = this.queue$.pipe(
    map(files => combineLatest(files.map(file => file.progress$))),
    switchMap(progresses => progresses),
    map(progresses => progresses.reduce((acc, curr) => acc + curr.value, 0) / progresses.length),
  );

  /**
   * Attempts to reset the queue and returns if the operation succeeded.
   * Also returns true if the current queue is empty.
   * @param {boolean} needConfirmation
   * Whether the user needs to confirm resetting the queue. Defaults to true.
   */
  public async resetQueue(needConfirmation = true) {
    const mediaType = this.mediaType();
    const queue = this.queue();
    if (queue.length === 0) return true;

    if (needConfirmation && queue.length > 0) {
      const confirmed = await this.helper.confirm(
        'This action will clear the current queue.\nContinue?',
      );
      if (!confirmed) return false;
    }

    this.shouldCancelInProgress = true;
    this.queue.set([]);

    if (needConfirmation) {
      await this.backend
        .cancelUpload(this.uuid(), mediaType)
        .then(() => {})
        .catch(err => console.error('Failed deleting files from server', err));
    }
    this.uploadEnabled.set(true);
    this.uploadCompleted.set(false);
    this.isUploading.set(false);
    this.uuid.set(new ObjectID().toString());
    return true;
  }

  public startUpload() {
    const type = this.mediaType();
    if (!type) {
      // TODO: Dialog instead of alert
      alert('Mediatype could not be determined');
      return false;
    }

    this.shouldCancelInProgress = false;

    // Update headers to automatically determined mediatype
    const queue = this.queue();
    this.queue.set(queue.map(file => ({ ...file, options: { ...file.options, type } })));
    this.isUploading.set(true);
    return true;
  }

  public setMediaType(type: string) {
    this.mediaType.set(type);
  }

  private async initiateChecksumCalculation(file: File) {
    const checksum = await calculateMD5(file);

    const queue = this.queue();
    const fileIndex = queue.findIndex(item => item._file === file);

    if (fileIndex !== -1) {
      queue[fileIndex] = {
        ...queue[fileIndex],
        checksum,
      };
      this.queue.set([...queue]);
      console.log('Updated checksum in queue', queue[fileIndex], this.queue());
    } else {
      console.error('File not found in queue');
    }
  }

  private async fileToQueueable(_file: File): Promise<IQFile> {
    const relativePath = _file.webkitRelativePath ?? '';
    const token = this.uuid();
    setTimeout(() => this.initiateChecksumCalculation(_file), 0);

    const queueableFile: IQFile = {
      _file,
      progress$: new BehaviorSubject({ value: 0 }),
      isCancel: false,
      isSuccess: false,
      isError: false,
      checksum: '',
      options: {
        relativePath,
        token,
        type: this.mediaType(),
      },
    };

    return queueableFile;
  }

  private pushToQueue(files: IQFile[]) {
    this.queue.update(queue => queue.concat(files));
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
    const uuid = this.uuid();
    const type = this.mediaType();

    const queueUploadResult = await this.backend.processUpload(uuid, type);
    console.log('queueUploadResult', queueUploadResult);
    if (queueUploadResult.requiresProcessing) {
      await new Promise<void>(async (resolve, reject) => {
        const getInfo = async () => {
          const info = await this.backend.processInfo(uuid, type);
          this.processingProgress.set({ value: info.progress });
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
    this.uploadCompleted.set(true);
    this.isUploading.set(false);
    if (Array.isArray(completeUploadResult?.files)) {
      this.uploadResults.set(completeUploadResult.files);
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
