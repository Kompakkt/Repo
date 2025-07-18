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

  public quickAddToCompilation = async (compilation: ICompilation, _id: string) => {
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

    let entity;

    try {
      entity = await this.#backend.getEntity(_id);
    } catch (error) {
      console.error('Error fetching entity:', error);
      this.#snackbar.showMessage('Error fetching object!');
      return;
    }

    if(!entity) {
      this.#snackbar.showMessage('No object found!');
    }

    try {
      const _compilation = await this.#backend.getCompilation(compilation._id);
      if(!_compilation) throw new Error('Password protected compilation');

      if(compilationHasObject(_compilation)) {
        this.#snackbar.showMessage('Object already in collection!');
        return;
      }

      _compilation.entities[_id] = entity;

      const result = await this.#backend.pushCompilation(_compilation);
    
        this.#account.updateTrigger$.next(Collection.compilation);

        console.log('Updated compilation: ', result);
         this.#snackbar.showMessage('Added object to collection!');
    } catch (error) {
      console.error('Error updating compilation:', error);
    }     
  };
}
