import { Injectable } from '@angular/core';
import { Clipboard } from '@angular/cdk/clipboard';
import { NotificationService } from '../components/notification-area/notification-area.component';

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
    private notification: NotificationService,
    private clipboard: Clipboard,
  ) {
    window.addEventListener('copy-to-clipboard', (event: CustomEvent<string>) => {
      this.copy(event.detail);
    });
  }

  public copy(message: string) {
    if (this.clipboard.copy(message))
      this.notification.showNotification({ message: 'Copied to clipboard', type: 'info' });
    else
      this.notification.showNotification({ message: 'Could not copy to clipboard', type: 'warn' });
  }
}
