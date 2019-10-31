import { Injectable } from '@angular/core';
import { ReplaySubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class EventsService {
  private windowMessageSubject = new ReplaySubject<any>();
  public $windowMessage = this.windowMessageSubject.asObservable();

  constructor() {
    window.onmessage = message => this.windowMessageSubject.next(message);
  }
}
