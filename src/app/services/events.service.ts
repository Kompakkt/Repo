import { Injectable } from '@angular/core';
import { ReplaySubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class EventsService {
  private windowMessageSubject = new ReplaySubject<any>();
  public $windowMessage = this.windowMessageSubject.asObservable();

  constructor() {
    window.onmessage = message => this.updateWindowEvent(message);
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
      throw new Error('Message is missing data or type');
      return;
    }
    this.windowMessageSubject.next(message);
  }
}
