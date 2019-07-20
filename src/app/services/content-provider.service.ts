import {Injectable} from '@angular/core';
import {ReplaySubject} from 'rxjs';

import {MongoHandlerService} from './mongo-handler.service';
import {IModel} from '../interfaces';

@Injectable({
  providedIn: 'root',
})
export class ContentProviderService {

  private ModelsSubject = new ReplaySubject<IModel[]>();
  public ModelsObservable = this.ModelsSubject.asObservable();

  constructor(private mongo: MongoHandlerService) {
    this.mongo.getAllModels()
      .then(result => this.ModelsSubject.next(result))
      .catch(err => console.error(err));
  }
}
