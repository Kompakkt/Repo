import { Injectable } from '@angular/core';
import { Clipboard } from '@angular/cdk/clipboard';

import { SnackbarService } from './';

@Injectable({
  providedIn: 'root',
})
export class ClipboardService {
  constructor(
    private snackbar: SnackbarService,
    private clipboard: Clipboard,
  ) {}

  public copy(message: string) {
    if (this.clipboard.copy(message)) this.snackbar.showMessage('Copied to clipboard');
    else this.snackbar.showMessage('Could not copy to clipboard');
  }
}
