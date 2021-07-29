import { Injectable } from '@angular/core';
import { BehaviorSubject, ReplaySubject } from 'rxjs';

import { BackendService } from './backend.service';
import {
  HttpClient,
  HttpErrorResponse,
  HttpEventType,
  HttpResponse,
} from '@angular/common/http';
import { UuidService } from './uuid.service';
import { environment } from '../../environments/environment';
import { IFile } from '~common/interfaces';

interface IQFile {
  _file: File;
  isSuccess: boolean;
  isCancel: boolean;
  isError: boolean;
  progress: number;
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

@Injectable({
  providedIn: 'root',
})
export class UploadHandlerService {
  public uploadEnabled = true;
  public isUploading = false;
  public uploadCompleted = false;
  public mediaType = '';

  public shouldCancelInProgress = false;
  private uploadEndpoint = `${environment.express_server_url}:${environment.express_server_port}/upload`;
  public queue: IQFile[] = [];
  public uploader = {
    progress: () => {
      return this.queue.length === 0
        ? 0
        : this.queue.reduce((acc, val) => acc + val.progress, 0) /
            this.queue.length;
    },
    uploadAll: async () => {
      this.uploadEnabled = false;
      this.shouldCancelInProgress = false;
      let errorFreeUpload = true;
      for (const item of this.queue) {
        if (!errorFreeUpload) break;
        const formData = new FormData();
        formData.append('relativePath', item.options.relativePath);
        formData.append('token', item.options.token);
        formData.append('type', item.options.type);
        formData.append('file', item._file, item._file.name);
        await new Promise<void>((resolve, reject) => {
          this.http
            .post(this.uploadEndpoint, formData, {
              withCredentials: true,
              observe: 'events',
              reportProgress: true,
            })
            .subscribe((event: any) => {
              if (this.shouldCancelInProgress) {
                reject();
                return;
              }
              if (event.type === HttpEventType.UploadProgress) {
                item.progress = Math.floor((event.loaded / event.total) * 100);
              } else if (event instanceof HttpResponse) {
                item.isSuccess = true;
                item.progress = 100;
                resolve();
              } else if (event instanceof HttpErrorResponse) {
                item.isError = true;
                errorFreeUpload = false;
                reject();
              }
            });
        });
      }
      if (errorFreeUpload) {
        this.handleUploadCompleted();
      } else {
        alert('Upload failed');
        this.resetQueue();
      }
    },
    getNotUploadedItems: () => {
      return this.queue.filter(file => file.progress < 100).length;
    },
  };

  private _FileQueueSubject = new BehaviorSubject<IQFile[]>([]);
  public $FileQueue = this._FileQueueSubject.asObservable();
  private ObjectType = 'model';

  private _UploadResultSubject = new ReplaySubject<IFile[]>();
  public $UploadResult = this._UploadResultSubject.asObservable();

  constructor(
    private backend: BackendService,
    private http: HttpClient,
    private UUID: UuidService,
  ) {
    this.$FileQueue.subscribe(() =>
      this.setMediaType(this.determineMediaType()),
    );
  }

  // Return whether the Queue got reset
  public async resetQueue(needConfirmation = true) {
    if (this.queue.length === 0) {
      return false;
    }

    if (
      needConfirmation &&
      this.queue.length > 0 &&
      !confirm('You are about to cancel your upload progress. Continue?')
    ) {
      return false;
    }

    this.shouldCancelInProgress = true;
    this.queue.splice(0, this.queue.length);
    if (needConfirmation) {
      await this.backend
        .cancelUpload(this.UUID.UUID, this.ObjectType)
        .then(() => {})
        .catch(err => console.error(err));
    }
    this.uploadEnabled = true;
    this.uploadCompleted = false;
    this.isUploading = false;
    this.UUID.reset();
    this._FileQueueSubject.next(this.queue);
    return true;
  }

  public startUpload() {
    this.setMediaType(this.determineMediaType());

    if (!this.mediaType || this.mediaType === '') {
      // TODO: Show dialog to select and update ObjectType in queue
      alert('Mediatype could not be determined');
      return;
    }

    // Update headers to automatically determined mediatype
    this.queue = this.queue.map(file => ({
      ...file,
      options: {
        ...file.options,
        type: this.mediaType,
      },
    }));

    this.isUploading = true;
    this.shouldCancelInProgress = false;
    this.uploader.uploadAll();
    console.log('UploadQueue', this.queue);
  }

  public setMediaType(type: string) {
    this.mediaType = type;
  }

  private pushToQueue(_file: File) {
    // https://developer.mozilla.org/en-US/docs/Web/API/File/webkitRelativePath
    // file as any since webkitRelativePath is experimental
    const relativePath = (_file as any)['webkitRelativePath'] ?? '';
    const token = this.UUID.UUID;
    this.queue.push({
      _file,
      progress: 0,
      isCancel: false,
      isSuccess: false,
      isError: false,
      options: {
        relativePath,
        token,
        type: this.ObjectType,
      },
    });
  }

  public addToQueue(file: File) {
    if (file) {
      this.pushToQueue(file);
      this._FileQueueSubject.next(this.queue);
    } else {
      console.warn('Invalid file', file);
    }
  }

  public addMultipleToQueue(files: File[]) {
    files.forEach(file => this.pushToQueue(file));
    this._FileQueueSubject.next(this.queue);
  }

  private async handleUploadCompleted() {
    this.uploadCompleted = true;
    this.isUploading = false;
    this.backend
      .completeUpload(this.UUID.UUID, this.mediaType)
      .then(result => {
        if (Array.isArray(result?.files)) {
          this._UploadResultSubject.next(result.files);
        } else {
          throw new Error('No files in server response');
        }
      })
      .catch(e => {
        console.error(e);
      });
  }

  public determineMediaType(
    filelist: string[] = this.queue.map(item => item._file.name),
  ) {
    // Determine mediaType by extension
    const fileExts: string[] = filelist
      .map(file => file.slice(file.lastIndexOf('.')))
      .map(fileExt => fileExt.toLowerCase());
    let mediaType = '';
    const _countMedia = {
      model: 0,
      image: 0,
      video: 0,
      audio: 0,
    };

    // Count file occurences
    for (const _ext of fileExts) {
      switch (true) {
        case modelExts.includes(_ext):
          _countMedia.model++;
          break;
        case imageExts.includes(_ext):
          _countMedia.image++;
          break;
        case videoExts.includes(_ext):
          _countMedia.video++;
          break;
        case audioExts.includes(_ext):
          _countMedia.audio++;
          break;
        default:
      }
    }

    // Since this is checking in order (3d model first)
    // we are able to determine models, even if e.g. textures are
    // also found
    switch (true) {
      case _countMedia.model > 0:
        mediaType = 'model';
        break;
      case _countMedia.image > 0:
        mediaType = 'image';
        break;
      case _countMedia.video > 0:
        mediaType = 'video';
        break;
      case _countMedia.audio > 0:
        mediaType = 'audio';
        break;
      default:
    }

    return mediaType;
  }
}
