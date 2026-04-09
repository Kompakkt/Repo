import { Injectable } from '@angular/core';
import { ReplaySubject } from 'rxjs';

import { environment } from 'src/environment';

@Injectable({
  providedIn: 'root',
})
export class EventsService {
  public windowMessages$ = new ReplaySubject<MessageEvent<{ type: string; data?: object }>>();

  constructor() {
    window.onmessage = (message: MessageEvent) => this.updateWindowEvent(message);

    (window as any)['sendMessageToViewer'] = (message: any) => this.sendMessageToViewer(message);
  }

  public updateSearchEvent() {
    const event = new MessageEvent('updateSearch', {
      data: { type: 'updateSearch' },
    });
    this.updateWindowEvent(event);
  }

  public updateWindowEvent(message: MessageEvent) {
    if (message?.data?.source?.includes('angular-devtools') || !!message?.data?.isAngular) return;
    if (!message.data || !message.data.type) {
      console.warn('Message is missing data or type', message);
      return;
    }
    if ('command' in message.data && message.data.command === 'calculateSubFramePositioning')
      return; // Ignore

    console.log('Window message', message);

    this.windowMessages$.next(message);
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
