import { Injectable } from '@angular/core';

import { AccountService } from './account.service';
import { BackendService } from './backend.service';
import { SnackbarService } from './snackbar.service';

import { IUserData, ICompilation, IEntity } from '../interfaces';

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
    this.account.userDataObservable.subscribe(newData => {
      this.userData = newData;
    });
  }

  public quickAddToCompilation = (compilation: ICompilation, _id: string) => {
    const compilationHasObject = (comp: ICompilation) =>
      (comp.entities as IEntity[])
        .filter(e => e)
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
    this.backend
      .getCompilation(compilation._id)
      .then(result => {
        if (!result) throw new Error('Password protected compilation');
        return result;
      })
      .then(_compilation => {
        if (compilationHasObject(_compilation)) {
          this.snackbar.showMessage('Object already in collection');
          throw new Error('Object already in collection');
        }
        _compilation.entities.push({ _id });
        return this.backend.pushCompilation(_compilation);
      })
      .then(result => {
        if (this.userData?.data?.compilation) {
          const found = this.userData.data.compilation.findIndex(
            comp => comp._id === result._id,
          );
          if (found) {
            this.userData.data.compilation.splice(found, 1, result);
          }
        }

        console.log('Updated compilation: ', result);
        this.snackbar.showMessage('Added object to collection');
      })
      .catch(err => console.error(err));
  };
}
