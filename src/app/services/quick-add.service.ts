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

@Injectable({
  providedIn: 'root',
})
export class QuickAddService {
  #account = inject(AccountService);
  #backend = inject(BackendService);
  #snackbar = inject(SnackbarService);

  public quickAddToCompilation = (compilation: ICompilation, _id: string) => {
    const compilationHasObject = (comp: ICompilation) =>
      (Object.values(comp.entities) as IEntity[])
        .filter(e => isEntity(e))
        .map(e => e._id)
        .includes(_id);

    if (compilationHasObject(compilation)) {
      this.#snackbar.showMessage('Object already in collection');
      return;
    }

    if (!_id || _id === '') {
      console.error('No object selected');
      return;
    }
    this.#backend
      .getCompilation(compilation._id)
      .then(result => {
        if (!result) throw new Error('Password protected compilation');
        return result;
      })
      .then(_compilation => {
        if (compilationHasObject(_compilation)) {
          this.#snackbar.showMessage('Object already in collection');
          throw new Error('Object already in collection');
        }
        _compilation.entities[_id] = { _id };
        return this.#backend.pushCompilation(_compilation);
      })
      .then(result => {
        this.#account.updateTrigger$.next(Collection.compilation);

        console.log('Updated compilation: ', result);
        this.#snackbar.showMessage('Added object to collection');
      })
      .catch(err => console.error(err));
  };
}
