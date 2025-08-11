import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { catchError } from 'rxjs';
import { Licences } from 'src/app/metadata/licences';
import { FilesizePipe, TranslatePipe } from 'src/app/pipes';
import { SnackbarService } from 'src/app/services';
import { BackendService, IDownloadOptions } from 'src/app/services/backend.service';
import { getServerUrl } from 'src/app/util/get-server-url';
import { IEntity, isDigitalEntity } from 'src/common';

@Component({
  selector: 'app-entity-download-dialog',
  imports: [MatIconModule, MatButtonModule, MatDialogModule, TranslatePipe, FilesizePipe],
  templateUrl: './entity-download-dialog.component.html',
  styleUrl: './entity-download-dialog.component.scss',
})
export class EntityDownloadDialogComponent {
  #snackbar = inject(SnackbarService);
  #backend = inject(BackendService);
  data = inject<{
    entity: IEntity;
    downloadOptions: IDownloadOptions;
  }>(MAT_DIALOG_DATA);

  digitalEntity = computed(() => {
    const data = this.data;
    const digitalEntity = data.entity.relatedDigitalEntity;
    return isDigitalEntity(digitalEntity) ? digitalEntity : null;
  });

  licence = computed(() => {
    const digitalEntity = this.digitalEntity();
    const licence = digitalEntity?.licence;
    return licence ? Licences[licence] : undefined;
  });

  #updatedDownloadOptions = signal<IDownloadOptions | undefined>(undefined);
  downloadOptions = computed(() => this.#updatedDownloadOptions() ?? this.data.downloadOptions);

  prepareType = signal<'' | 'raw' | 'processed'>('');
  prepareProgress = signal('0%');
  prepareTextColor = computed(() => {
    // Progress from 0 to 100
    const progress = +this.prepareProgress().slice(0, -1);
    const brandColor = getComputedStyle(document.documentElement).getPropertyValue('--brand-color');

    // Color conversion using canvas, gradient from brand color to white
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return progress < 40 ? brandColor : 'white';
    canvas.width = 1;
    canvas.height = 1;
    const gradient = ctx.createLinearGradient(0, 0, 1, 1);
    gradient.addColorStop(0, brandColor);
    gradient.addColorStop(0.6, 'white');
    gradient.addColorStop(1, 'white');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1, 1);
    const color = ctx.getImageData(0, 0, 1, 1).data;
    const r = Math.round(color[0] * (progress / 100) + 255 * (1 - progress / 100));
    const g = Math.round(color[1] * (progress / 100) + 255 * (1 - progress / 100));
    const b = Math.round(color[2] * (progress / 100) + 255 * (1 - progress / 100));

    // Cleanup
    canvas.remove();
    return `rgb(${r}, ${g}, ${b})`;
  });

  async prepare(type: 'raw' | 'processed') {
    if (this.prepareType() !== '') {
      this.#snackbar.showMessage('Preparation of an archive is already in progress');
      return;
    }

    const options = this.downloadOptions();
    const element = this.data.entity;
    if (type === 'processed' && !options.hasCompressedFiles) {
      this.#snackbar.showMessage('No processed files available for download');
      return;
    }

    if (options.zipStats[type] > 0) {
      this.#snackbar.showMessage('Archive is ready and can be downloaded');
      return;
    }

    this.prepareType.set(type);
    const success = await new Promise<boolean>(resolve => {
      this.#backend
        .prepareEntityDownload(element._id, type)
        .pipe(
          catchError(err => {
            console.error('Error while preparing archive for download', err);
            resolve(false);
            return [];
          }),
        )
        .subscribe(event => {
          if ('partialText' in event && typeof event.partialText === 'string') {
            const progress = event.partialText.trim().split('\n').at(-1);
            if (!progress) return;
            const progressNumber = parseFloat(progress);
            if (isNaN(progressNumber)) return;
            console.log('Prepare progress', progress);
            this.prepareProgress.set((progressNumber * 100).toString() + '%');
            if (progressNumber >= 1) {
              return resolve(true);
            }
          }
        });
    });
    if (!success) {
      this.#snackbar.showMessage('Error while preparing archive for download');
      this.prepareType.set('');
      this.prepareProgress.set('0%');
      return;
    }

    // Simulate a delay for the sake of user experience
    setTimeout(async () => {
      const updatedDownloadOptions = await this.#backend.getEntityDownloadStats(element._id);
      this.prepareType.set('');
      this.prepareProgress.set('0%');
      this.#updatedDownloadOptions.set(updatedDownloadOptions);
      this.#snackbar.showMessage('Archive is ready and can be downloaded');
    }, 500);
  }

  download(type: 'raw' | 'processed') {
    const options = this.downloadOptions();
    const element = this.data.entity;
    if (type === 'processed' && !options.hasCompressedFiles) {
      this.#snackbar.showMessage('No processed files available for download');
      return;
    }

    if (options.zipStats[type] > 0) {
      this.#snackbar.showMessage('Download of the archived file will be starting in a moment');
    } else {
      this.#snackbar.showMessage('Archive still needs to be prepared');
    }

    const anchor = document.createElement('a');
    anchor.href = getServerUrl(`download/${element._id}/${type}`);
    anchor.download = `${element._id}_${type}.zip`;
    anchor.click();
  }
}
