import { Injectable } from '@angular/core';

import { IEntity, ICompilation } from 'src/common';
import { SnackbarService } from './';

@Injectable({
  providedIn: 'root',
})
export class DetailPageHelperService {
  constructor(private snackbar: SnackbarService) {}

  public getNumQualities = (element: IEntity) => new Set(Object.values(element.processed)).size;

  public getQualitiesAndSizes = (element: IEntity) => {
    const low = element.files.find(_f => _f.file_link === element.processed.low);
    const high = element.files.find(_f => _f.file_link === element.processed.high);
    if (!low || !high) return '';
    return low.file_size === high.file_size
      ? `Approx. ~${Math.round(low.file_size / 1024 / 1024)}MB`
      : `Between ${Math.round(low.file_size / 1024 / 1024)} and ${Math.round(
          high.file_size / 1024 / 1024,
        )}MB`;
  };

  public getCreationDate(element: IEntity | ICompilation) {
    return new Date(parseInt(element._id.toString().slice(0, 8), 16) * 1000).toLocaleString(
      'en-US',
      {
        year: 'numeric',
        month: 'long',
        day: '2-digit',
      },
    );
  }

  public copyID(_id: string) {
    try {
      this.copyToClipboard(_id);
      this.snackbar.showMessage('Collection ID copied to clipboard.', 3);
    } catch (e) {
      console.error(e);
      this.snackbar.showMessage('Could not access your clipboard.', 3);
    }
  }

  public copyEmbed(embed: string) {
    try {
      this.copyToClipboard(embed);
      this.snackbar.showMessage('Copied embed-markup to clipboard.', 3);
    } catch (e) {
      console.error(e);
      this.snackbar.showMessage('Could not access your clipboard.', 3);
    }
  }

  private copyToClipboard(content: string) {
    if ((navigator as any).clipboard) {
      (navigator as any).clipboard.writeText(content);
    } else if ((window as any).clipboardData) {
      (window as any).clipboardData.setData('text', content);
    }
  }
}
