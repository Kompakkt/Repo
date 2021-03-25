import { Injectable } from '@angular/core';

import { BackendService } from './backend.service';
import { isEntity, ICompilation, IEntity } from '~common/interfaces';

interface ICountEntityUsesResponse {
  occurences: number;
  compilations: ICompilation[];
}

@Injectable({
  providedIn: 'root',
})
export class SelectHistoryService {
  public usedInCompilations: ICountEntityUsesResponse = {
    occurences: 0,
    compilations: [],
  };
  private selectionHistory = new Array<IEntity | ICompilation>();

  constructor(private backend: BackendService) {
    try {
      let result = localStorage.getItem('kompakktSelectionHistory');
      if (!result) throw 'Key empty or not found';
      result = JSON.parse(result);
      if (!result || !Array.isArray(result)) throw 'Invalid';
      this.selectionHistory = result as Array<IEntity | ICompilation>;
    } catch (e) {
      console.log('No selection history in localStorage', e);
    }
  }

  public resetEntityUses() {
    this.usedInCompilations = {
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
      this.backend
        .countEntityUses(element._id)
        .then(result => (this.usedInCompilations = result))
        .catch(() => this.resetEntityUses());
    }

    try {
      localStorage.setItem('kompakktSelectionHistory', JSON.stringify(this.selectionHistory));
    } catch (e) {
      console.log('Failed updating localStorage selectionHistory', e);
    }
  }

  get history() {
    return this.selectionHistory;
  }
}
