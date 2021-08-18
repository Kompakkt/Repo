import { Injectable } from '@angular/core';

import { EventsService } from './';

@Injectable({
  providedIn: 'root',
})
export class ViewerRepoCommunicationService {
  constructor(private events: EventsService) {
    this.events.$windowMessage.subscribe(message => console.log('viewerRepoComm:', message));
  }
}
