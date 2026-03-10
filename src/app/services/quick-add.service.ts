import { inject, Injectable } from '@angular/core';

import {
  Collection,
  ICompilation,
  IEntity,
  IUserData,
  areDocumentsEqual,
  isEntity,
} from 'src/common';
import { AccountService, BackendService, SnackbarService } from './';
import { isEmpty } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class QuickAddService {
  #account = inject(AccountService);
  #backend = inject(BackendService);
  #snackbar = inject(SnackbarService);

  public quickAddToCompilation = async (
    { _id: compilationId }: ICompilation,
    _id: string | string[],
  ) => {
    const _ids = Array.isArray(_id) ? _id : [_id];

    if (_ids.length === 0) {
      console.error('No object selected');
      return;
    }

    const added: string[] = [];
    const existing: string[] = [];
    const failed: string[] = [];

    try {
      const compilation = await this.#backend.getCompilation(compilationId);
      if (!compilation) throw new Error('Password protected compilation');

      for (const id of _ids) {
        try {
          const entity = await this.#backend.getEntity(id);
          if (!entity) {
            failed.push(id);
            continue;
          }

          if (!compilation.entities[id]) {
            compilation.entities[id] = entity;
            added.push(id);
          }
        } catch {
          failed.push(id);
        }
      }

      const result = await this.#backend.pushCompilation(compilation);
      this.#account.updateTrigger$.next(Collection.compilation);
      console.log('Updated compilation: ', result);

      if (added.length)
        this.#snackbar.showMessage(`Added ${added.length} object(s) to collection!`);
      if (existing.length)
        this.#snackbar.showMessage(`${existing.length} object(s) already in collection!`);
      if (failed.length) this.#snackbar.showMessage(`Failed fetching ${failed.length} object(s)!`);
    } catch (error) {
      console.error('Error updating compilation:', error);
    }
  };
}
