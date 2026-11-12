import { inject, Service } from '@angular/core';
import { Clipboard } from '@angular/cdk/clipboard';
import { SnackbarService } from './snackbar.service';

declare global {
  interface WindowEventMap {
    'copy-to-clipboard': CustomEvent<string>;
  }
}

@Service()
export class ClipboardService {
  #snackbar = inject(SnackbarService);
  #clipboard = inject(Clipboard);

  constructor() {
    window.addEventListener('copy-to-clipboard', (event: CustomEvent<string>) => {
      this.copy(event.detail);
    });
  }

  public copy(message: string) {
    if (this.#clipboard.copy(message)) this.#snackbar.showMessage('Copied to clipboard');
    else this.#snackbar.showMessage('Could not copy to clipboard');
  }
}
