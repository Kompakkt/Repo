import { Injectable } from '@angular/core';
import { ReplaySubject } from 'rxjs';

import { MongoHandlerService } from './mongo-handler.service';
import { IEntity } from '../interfaces';

@Injectable({
  providedIn: 'root',
})
export class ContentProviderService {
  private EntitiesSubject = new ReplaySubject<IEntity[]>();
  public EntitiesObservable = this.EntitiesSubject.asObservable();

  constructor(private mongo: MongoHandlerService) {
    this.mongo
      .getAllEntities()
      .then(result => this.EntitiesSubject.next(result))
      .catch(err => console.error(err));
  }
}
