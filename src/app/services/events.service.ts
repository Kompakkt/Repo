import { Injectable } from '@angular/core';
import { ReplaySubject } from 'rxjs';

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class EventsService {
  private windowMessageSubject = new ReplaySubject<any>();
  public $windowMessage = this.windowMessageSubject.asObservable();

  constructor() {
    window.onmessage = (message: any) => this.updateWindowEvent(message);

    (window as any)['sendMessageToViewer'] = this.sendMessageToViewer;
  }

  public updateSearchEvent() {
    const event = new MessageEvent('updateSearch', {
      data: { type: 'updateSearch' },
    });
    this.updateWindowEvent(event);
  }

  public updateWindowEvent(message: any) {
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
        console.log(new URL(environment.kompakkt_url).origin);
        iframe.contentWindow.postMessage(
          message,
          new URL(environment.kompakkt_url).origin,
        );
      }
    });
  }
}
