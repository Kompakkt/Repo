import { Injectable } from '@angular/core';
import { ReplaySubject } from 'rxjs';

import { environment } from 'src/environment';

@Injectable({
  providedIn: 'root',
})
export class EventsService {
  private windowMessageSubject = new ReplaySubject<MessageEvent>();
  public $windowMessage = this.windowMessageSubject.asObservable();

  constructor() {
    window.onmessage = (message: MessageEvent) => this.updateWindowEvent(message);

    (window as any)['sendMessageToViewer'] = this.sendMessageToViewer;
  }

  public updateSearchEvent() {
    const event = new MessageEvent('updateSearch', {
      data: { type: 'updateSearch' },
    });
    this.updateWindowEvent(event);
  }

  public updateWindowEvent(message: MessageEvent) {
    if (message?.data?.source?.includes('angular-devtools') || !!message?.data?.isAngular) return;
    console.log('Window message', message);
    if (!message.data || !message.data.type) {
      console.warn('Message is missing data or type');
      return;
    }
    this.windowMessageSubject.next(message);
  }

  public sendMessageToViewer(message: any) {
    console.log('Attempting to send to Viewer:', message);

    if (message.type && message.type === 'params') {
      const baseParams = {
        mode: '',
        entity: undefined,
        compilation: undefined,
      };

      message.params = { ...baseParams, ...message.params };
    }

    document.querySelectorAll('iframe').forEach((iframe: HTMLIFrameElement) => {
      if (iframe && iframe.contentWindow) {
        console.log(new URL(environment.viewer_url).origin);
        iframe.contentWindow.postMessage(message, new URL(environment.viewer_url).origin);
      }
    });
  }
}
