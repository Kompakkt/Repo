import { Injectable } from '@angular/core';

import { MongoHandlerService } from './mongo-handler.service';
import { ICompilation, IEntity } from '../interfaces';
import { isCompilation, isEntity } from '../typeguards';

interface ICountEntityUsesResponse {
  status: string;
  occurences: number;
  compilations: ICompilation[];
}

@Injectable({
  providedIn: 'root',
})
export class SelectHistoryService {
  public usedInCompilations: ICountEntityUsesResponse = {
    status: 'ok',
    occurences: 0,
    compilations: [],
  };
  private selectionHistory = new Array<IEntity | ICompilation>();

  constructor(private mongo: MongoHandlerService) {}

  public resetEntityUses() {
    this.usedInCompilations = {
      status: 'ok',
      occurences: 0,
      compilations: [],
    };
  }

  public async select(element: IEntity | ICompilation) {
    // Append element to history
    if (element) {
      // If element exists in history, remove
      const _id = element._id;
      const index = this.selectionHistory.findIndex(el => el._id === _id);
      if (index >= 0) {
        this.selectionHistory.splice(index, 1);
      }
      // Append element at end of history
      this.selectionHistory.push(element);

      // Limit history length
      if (this.selectionHistory.length > 10) {
        this.selectionHistory.shift();
      }
    }

    if (isEntity(element)) {
      this.mongo
        .countEntityUses(element._id)
        .then(result => {
          if (result.status === 'ok') {
            this.usedInCompilations = result;
          }
        })
        .catch(
          _ =>
            (this.usedInCompilations = {
              status: 'ok',
              occurences: 0,
              compilations: [],
            }),
        );
    }
  }

  get history() {
    return this.selectionHistory;
  }
}
