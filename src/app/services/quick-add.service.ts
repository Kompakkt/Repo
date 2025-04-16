import { Injectable } from '@angular/core';

import { ICompilation, IEntity, IUserData, areDocumentsEqual, isEntity } from 'src/common';
import { AccountService, BackendService, SnackbarService } from './';

@Injectable({
  providedIn: 'root',
})
export class QuickAddService {
  private userData: IUserData | undefined;

  constructor(
    private account: AccountService,
    private backend: BackendService,
    private snackbar: SnackbarService,
  ) {
    this.account.userData$.subscribe(newData => {
      this.userData = newData;
    });
  }

  public quickAddToCompilation = async (compilation: ICompilation, _id: string) => {

    const compilationHasObject = (comp: ICompilation) =>
      (Object.values(comp.entities) as IEntity[])
        .filter(e => isEntity(e))
        .map(e => e._id)
        .includes(_id);

    if (compilationHasObject(compilation)) {
      this.snackbar.showMessage('Object already in collection');
      return;
    }

    if (!_id || _id === '') {
      console.error('No object selected');
      return;
    }

    let entity;

    try {
      entity = await this.backend.getEntity(_id);
    } catch (error) {
      console.error('Error fetching entity:', error);
      this.snackbar.showMessage('Error fetching object!');
      return;
    }

    if(!entity) {
      this.snackbar.showMessage('No object found!');
    }

    try {
      const _compilation = await this.backend.getCompilation(compilation._id);
      if(!_compilation) throw new Error('Password protected compilation');

      if(compilationHasObject(_compilation)) {
        this.snackbar.showMessage('Object already in collection!');
        return;
      }

      _compilation.entities[_id] = entity;

      const result = await this.backend.pushCompilation(_compilation);

        // TODO: update user in account service
        if (this.userData?.data?.compilation) {
          const found = this.userData.data.compilation.findIndex(comp =>
            areDocumentsEqual(comp, result),
          );
          if (found) {
            this.userData.data.compilation.splice(found, 1, result);
          }
        }

        console.log('Updated compilation: ', result);

        this.snackbar.showMessage('Added object to collection!');
    } catch (error) {
      console.error('Error updating compilation:', error);
    }
  };
}
