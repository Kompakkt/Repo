import { Injectable } from '@angular/core';
import { BehaviorSubject, ReplaySubject } from 'rxjs';

import { MongoHandlerService } from './mongo-handler.service';
import {
  HttpClient,
  HttpErrorResponse,
  HttpEventType,
  HttpHeaders,
  HttpResponse,
} from '@angular/common/http';
import { UuidService } from './uuid.service';
import { environment } from '../../environments/environment';
import { IServerResponse, IFile } from '../interfaces';

interface IQFile {
  _file: File;
  isSuccess: boolean;
  isCancel: boolean;
  isError: boolean;
  progress: number;
  headers: HttpHeaders;
}

@Injectable({
  providedIn: 'root',
})
export class UploadHandlerService {
  public uploadEnabled = true;
  public isUploading = false;
  public uploadCompleted = false;
  public mediaType = 'model';

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
        formData.append('file', item._file, item._file.name);
        await new Promise((resolve, reject) => {
          this.http
            .post(this.uploadEndpoint, formData, {
              headers: item.headers,
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
                item.progress = Math.floor(event.loaded / event.total) * 100;
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

  private _UploadResultSubject = new ReplaySubject<{
    status: string;
    files: IFile[];
  }>();
  public $UploadResult = this._UploadResultSubject.asObservable();

  constructor(
    private mongo: MongoHandlerService,
    private http: HttpClient,
    private UUID: UuidService,
  ) {}

  // Return whether the Queue got reset
  public async resetQueue() {
    if (this.queue.length === 0) {
      return false;
    }

    if (
      this.queue.length > 0 &&
      !confirm('You are about to cancel your upload progress. Continue?')
    ) {
      return false;
    }

    this.shouldCancelInProgress = true;
    this.queue.splice(0, this.queue.length);
    await this.mongo
      .cancelUpload(this.UUID.UUID, this.ObjectType)
      .then(() => {})
      .catch(err => console.error(err));
    this.uploadEnabled = true;
    this.uploadCompleted = false;
    this.isUploading = false;
    this.UUID.reset();
    this._FileQueueSubject.next(this.queue);
    return true;
  }

  public startUpload() {
    if (!this.mediaType || this.mediaType === '') {
      // TODO: Show dialog to select and update ObjectType in queue
      alert('Mediatype could not be determined');
      return;
    }

    // Update headers to automatically determined mediatype
    this.queue = this.queue.map(file => {
      const relPath = file.headers.get('relPath') as string;
      const semirandomtoken = file.headers.get('semirandomtoken') as string;
      file.headers = new HttpHeaders({
        relPath,
        semirandomtoken,
        filetype: this.mediaType,
      });
      return file;
    });

    this.isUploading = true;
    this.shouldCancelInProgress = false;
    this.uploader.uploadAll();
    console.log('UploadQueue', this.queue);
  }

  public setMediaType(type: string) {
    this.mediaType = type;
  }

  public addToQueue(file: File) {
    if (file) {
      this.queue.push({
        _file: file,
        progress: 0,
        isCancel: false,
        isSuccess: false,
        isError: false,
        headers: new HttpHeaders({
          relPath: file['webkitRelativePath'],
          semirandomtoken: this.UUID.UUID,
          filetype: this.ObjectType,
        }),
      });

      this._FileQueueSubject.next(this.queue);
    } else {
      console.warn('Invalid file', file);
    }
  }

  public addMultipleToQueue(files: File[]) {
    files.forEach(file => {
      this.queue.push({
        _file: file,
        progress: 0,
        isCancel: false,
        isSuccess: false,
        isError: false,
        headers: new HttpHeaders({
          relPath: file['webkitRelativePath'],
          semirandomtoken: this.UUID.UUID,
          filetype: this.ObjectType,
        }),
      });
    });
    this._FileQueueSubject.next(this.queue);
  }

  private async handleUploadCompleted() {
    this.uploadCompleted = true;
    this.isUploading = false;
    this.mongo
      .completeUpload(this.UUID.UUID, this.mediaType)
      .then(result => this._UploadResultSubject.next(result));
  }
}
