import { HttpClient, HttpErrorResponse, HttpEventType, HttpResponse } from '@angular/common/http';
import { computed, effect, Injectable, signal } from '@angular/core';
import { map, switchMap } from 'rxjs/operators';
import spark from 'spark-md5';
import ObjectID from 'bson-objectid';

import { toObservable } from '@angular/core/rxjs-interop';
import { BehaviorSubject, combineLatest, lastValueFrom } from 'rxjs';
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
  error?: {
    message: string;
    type: 'filesize';
  };
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
    const startTime = performance.now();
    // Read in chunks of 4MB
    // Settings this higher yields negligible performance improvements while increasind load on browser
    const chunkSize = 4 * 1024 * 1024;
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
        const duration = ((performance.now() - startTime) / 1000).toFixed(2);
        console.log(
          'Computed MD5 checksum',
          hash,
          'for file',
          file.name,
          'in',
          duration,
          'seconds',
        );
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
  private initEndpoint = getServerUrl(`upload/chunk/init`);
  private chunkEndpoint = getServerUrl(`upload/chunk/upload`);
  private finishEndpoint = getServerUrl(`upload/chunk/finish`);

  readonly #checksumPromiseMap = new Map<File, Promise<string>>();
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

  // 2GB in bytes
  maxFileSizeBytes = 2 * 1024 * 1024 * 1024;
  maxFileSizeGB = this.maxFileSizeBytes / (1024 * 1024 * 1024);

  // Defined by backend chunk upload limits
  private readonly CHUNK_SIZE = 4 * 1024 * 1024;

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

      const uploads = queue.map(item => {
        const normalizedRelativePath = item.options.relativePath
          .split('/')
          .slice(minSameSegments)
          .join('/');

        return this.uploadFileChunked(item, normalizedRelativePath);
      });

      Promise.all(uploads)
        .then(results => {
          console.log('Post upload queue', results);
          return this.handleUploadCompleted();
        })
        .catch(error => {
          console.log('Upload failed', error);
          alert('Upload failed');
          this.resetQueue(false);
        });
    });
  }

  private async uploadFileChunked(item: IQFile, normalizedRelativePath: string): Promise<IQFile> {
    try {
      // 1. Initialize Upload
      const initResponse = await lastValueFrom(
        this.http.post<{ status: string; uploadId: string }>(
          this.initEndpoint,
          {},
          { withCredentials: true },
        ),
      );

      if (!initResponse || !initResponse.uploadId) {
        throw new Error('Failed to initialize upload');
      }

      const uploadId = initResponse.uploadId;
      const file = item._file;
      const totalChunks = Math.ceil(file.size / this.CHUNK_SIZE);

      // 2. Upload Chunks
      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        if (this.shouldCancelInProgress) {
          throw new Error('Upload cancelled by user');
        }

        const start = chunkIndex * this.CHUNK_SIZE;
        const end = Math.min(start + this.CHUNK_SIZE, file.size);
        const chunkBlob = file.slice(start, end);

        const formData = new FormData();
        formData.append('chunk', chunkBlob);
        formData.append('uploadId', uploadId);
        formData.append('index', chunkIndex.toString());

        await new Promise<void>((resolve, reject) => {
          this.http.post(this.chunkEndpoint, formData, { withCredentials: true }).subscribe({
            next: event => {
              // Calculate progress by current chunk of total chunks
              const progressValue = Math.floor(
                Math.min(100, ((chunkIndex + 1) / totalChunks) * 100),
              );
              item.progress$.next({ value: progressValue });

              resolve();
            },
            error: err => {
              item.isError = true;
              reject(err);
            },
          });
        });
      }

      // 3. Finish and Verify
      const finishBody = {
        uploadId,
        filename: file.name,
        relativePath: normalizedRelativePath,
        token: item.options.token,
        type: item.options.type,
      };

      const finishResponse = await lastValueFrom(
        this.http.post<{ status: string; path: string; serverChecksum: string }>(
          this.finishEndpoint,
          finishBody,
          { withCredentials: true },
        ),
      );

      // 4. Checksum Verification
      console.log('Waiting for checksum promise:', this.#checksumPromiseMap.has(item._file));

      const clientChecksum =
        (this.#checksumPromiseMap.has(item._file)
          ? await this.#checksumPromiseMap.get(item._file)!
          : this.queue().find(i => i._file === item._file)?.checksum) ?? item.checksum;

      if (finishResponse.serverChecksum !== clientChecksum) {
        console.error(
          'Checksum mismatch',
          item._file.name,
          'Client:',
          clientChecksum,
          'Server:',
          finishResponse.serverChecksum,
        );
        item.isError = true;
        throw new Error(`Checksum mismatch for file ${item._file.name}`);
      }

      item.isSuccess = true;
      item.progress$.next({ value: 100 });
      return item;
    } catch (error) {
      item.isError = true;
      item.progress$.next({ value: 0 });
      throw error;
    }
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
  queueHasErrors = computed(() => {
    const queue = this.queue();
    return queue.some(item => item.error !== undefined);
  });
  queueHasFilesizeErrors = computed(() => {
    const queue = this.queue();
    return queue.some(item => item.error?.type === 'filesize');
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
    const promise = calculateMD5(file);
    this.#checksumPromiseMap.set(file, promise);
    const checksum = await promise;
    this.#checksumPromiseMap.delete(file);

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

    let error: IQFile['error'] = undefined;
    if (_file.size > this.maxFileSizeBytes) {
      const fileSizeInGB = this.maxFileSizeGB.toFixed(2);
      error = {
        message: `File size exceeds maximum allowed size of ${fileSizeInGB} GB`,
        type: 'filesize' as const,
      };
    }

    if (!error) {
      setTimeout(() => this.initiateChecksumCalculation(_file), 0);
    }

    const queueableFile: IQFile = {
      _file,
      progress$: new BehaviorSubject({ value: 0 }),
      isCancel: false,
      isSuccess: false,
      isError: false,
      checksum: '',
      error,
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
