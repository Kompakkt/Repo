import { Injectable } from '@angular/core';
import { Clipboard } from '@angular/cdk/clipboard';

import { SnackbarService } from './';

declare global {
  interface WindowEventMap {
    'copy-to-clipboard': CustomEvent<string>;
  }
}

@Injectable({
  providedIn: 'root',
})
export class ClipboardService {
  constructor(
    private snackbar: SnackbarService,
    private clipboard: Clipboard,
  ) {
    window.addEventListener('copy-to-clipboard', (event: CustomEvent<string>) => {
      this.copy(event.detail);
    });
  }

  public copy(message: string) {
    if (this.clipboard.copy(message)) this.snackbar.showMessage('Copied to clipboard');
    else this.snackbar.showMessage('Could not copy to clipboard');
  }
}
